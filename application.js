function percentage(num) {
	return parseFloat(Math.round(num * 100)).toFixed(0) + " %";
}

function graphic(name) {
	return crel("img", {src:"https://dsde.innogamescdn.com/8.152/39836/graphic/" + name + ".png"});
}

function resetUnits(content) {
	content.innerHTML = "";
	crel(content, 
		crel("tr",
			crel("th", "Village"),
			crel("th", ""),
			crel("th", graphic("unit/unit_spear")),
			crel("th", graphic("unit/unit_sword")),
			crel("th", graphic("unit/unit_axe")),
			crel("th", graphic("unit/unit_spy")),
			crel("th", graphic("unit/unit_light")),
			crel("th", graphic("unit/unit_heavy")),
			crel("th", graphic("unit/unit_ram")),
			crel("th", graphic("unit/unit_catapult")),
			crel("th", graphic("unit/unit_knight")),
			crel("th", graphic("unit/unit_snob")),
			crel("th", graphic("unit/unit_militia")),
		)
	);
}

function resetProduction(content) {
	content.innerHTML = "";
	crel(content, 
		crel("tr",
			crel("th", "Village"),
			crel("th", { colspan: 3}, graphic("holz")),
			crel("th", { colspan: 3}, graphic("lehm")),
			crel("th", { colspan: 3}, graphic("eisen")),
			crel("th"),
			crel("th", graphic("buildings/storage")),
		)
	);
}

function getColorForPercentage(percent) {
	var percentColors = [
	    { percent: 0.0, color: { r: 0xff, g: 0x00, b: 0 } },
	    { percent: 0.4, color: { r: 0xff, g: 0xff, b: 0 } },
	    { percent: 0.6, color: { r: 0x00, g: 0xff, b: 0 } },
	    { percent: 0.8, color: { r: 0xff, g: 0xff, b: 0 } }, 
	    { percent: 1.0, color: { r: 0xff, g: 0x00, b: 0 } } ];
    for (var i = 1; i < percentColors.length - 1; i++) {
    	if (percent < percentColors[i].percent) {
    		break;
		}
	}

	var lower = percentColors[i - 1];
    var upper = percentColors[i];
    var range = upper.percent - lower.percent;
    var rangePct = (percent - lower.percent) / range;
    var pctLower = 1 - rangePct;
    var pctUpper = rangePct;
    var color = {
        r: Math.floor(lower.color.r * pctLower + upper.color.r * pctUpper),
        g: Math.floor(lower.color.g * pctLower + upper.color.g * pctUpper),
        b: Math.floor(lower.color.b * pctLower + upper.color.b * pctUpper)
    };
    return 'rgb(' + [color.r, color.g, color.b].join(',') + ')';
    // or output as hex if preferred
}  

function fillGauge(percent) {
	return crel("div", 
		{style: "position:relative; left: -125%; height: 0; width:350%; text-align:center; "},
		crel("div", 
			{style: "position:absolute; z-index: -2; background: #eeeeee; height:3px; width:100%;"}
		),
		crel("div", 
			{style: "position:absolute; z-index: -1; background: " + getColorForPercentage(percent) + "; height:3px; width:" + percent*100 + "%"}
		),
		crel("span", 
			{style: "z-index: 99999999999 !important;padding-left: 10%;"}, 
			percentage(percent)
		)
	);
}

function sumUnit(villages, type) {
	let keys = Object.keys(villages);
	return keys.reduce((sum, key) => {
		let units = villages[key].units;
		return sum + units[0][type] + units[2][type] + units[3][type];
	}, 0);
}

function updateUnits(content, data) {
	resetUnits(content);
	let keys = Object.keys(data.villages);
	for (let i in data.villages) {
		let village = data.villages[i];

		let population = data.buildings.farm.population[village.buildings.farm-1];
		crel(content,
			crel("tr",
				crel("td",
					crel("a", {href: 'https://de161.die-staemme.de/game.php?screen=overview&village='+village.id, target: "browser"}, village.name)
				),
				crel("td", "eigene"),
				village.units[0].map(v => crel("td", v)),
				),
			crel("tr", 
				crel("td", (population - village.population) + " (" + village.buildings.farm + ")"),
				crel("td", "Im Dorf"), village.units[1].map(v => crel("td", v))),
			crel("tr", 
				crel("td", village.population + "/" + population),
				crel("td", "auswärts"), 
				village.units[2].map(v => crel("td", v))),
			crel("tr", 
				crel("td"),
				crel("td", "unterwegs"), 
				village.units[3].map(v => crel("td", v))),
			);
	}			

	let unitTypes = {
		0: 1,
		1: 1,
		2: 1,
		3: 2,
		4: 4,
		5: 6,
		6: 5,
		7: 8,
		8: 10,
		9: 100,
		10: 0
	};
	crel(content,
		crel("tr",
			crel("th", "Total"),
			crel("th", "eigene"),
			Object.keys(unitTypes).map(type => crel("th", sumUnit(data.villages, type))),
			crel("th", Object.keys(unitTypes).reduce((sum, type) => sum + sumUnit(data.villages, type)*unitTypes[type], 0)),
		)
	);		
}

function addRessources(a, b) {
	return {
		wood: (a.wood || 0) + (b.wood || 0),
		stone: (a.stone || 0) + (b.stone || 0),
		iron: (a.iron || 0) + (b.iron || 0),
	}
}

function emptyRessources() {
	return { wood: 0, stone: 0, iron: 0 };
}

function ifAbs(value, minAbs) {
	if(Math.abs(value) > minAbs) {
		return value;
	}

	return "";
}

function updateProduction(content, data) {
	resetProduction(content);
	let keys = Object.keys(data.villages);

	let total = keys.reduce((sum, key) => addRessources(sum, data.villages[key].ressources), emptyRessources());
	let totalCapacity = keys.reduce((sum, key) => sum + data.buildings.storage.capacity[data.villages[key].buildings.storage-1], 0);	
	for (let i in data.villages) {
		let village = data.villages[i];

		let incoming = village.trades.reduce((sum, key) => addRessources(sum, key), emptyRessources());
		
		total = addRessources(total, incoming);

		let future = addRessources(incoming, village.ressources);

		let capacity = data.buildings.storage.capacity[village.buildings.storage-1];
		let diffWood = Math.round(total.wood / totalCapacity * capacity - future.wood);
		let diffStone = Math.round(total.stone / totalCapacity * capacity - future.stone);
		let diffIron = Math.round(total.iron / totalCapacity * capacity - future.iron);
		crel(content,
			crel("tr",
				crel("td",
					crel("a", {href: 'https://de161.die-staemme.de/game.php?screen=overview&village='+village.id, target: "browser"}, village.name)
				),
				crel("td",	{ title: incoming.wood > 0 ? incoming.wood : "n/a" }, incoming.wood > 0 ? "*" : "", future.wood),
				crel("td", fillGauge(future.wood / capacity)),
				crel("td", ifAbs(diffWood, 1000)),
				crel("td", { title: incoming.stone > 0 ? incoming.stone : "n/a" }, incoming.stone > 0 ? "*" : "", future.stone),
				crel("td", fillGauge(future.stone / capacity)),
				crel("td", ifAbs(diffStone, 1000)),
				crel("td", { title: incoming.iron > 0 ? incoming.iron : "n/a" }, incoming.iron > 0 ? "*" : "", future.iron),
				crel("td", fillGauge(future.iron / capacity)),
				crel("td", ifAbs(diffIron, 1000)),
				crel("td", crel("a", { href: "https://de161.die-staemme.de/game.php?screen=market&mode=send&target=" + village.id, target: "browser"}, "send" )),
				crel("td", capacity)),
			);
	}			

	crel(content,
		crel("tr",
			crel("th", "Total"),
			crel("th"),
			crel("th"),
			crel("th", total.wood),
			crel("th"),
			crel("th"),
			crel("th", total.stone),
			crel("th"),
			crel("th"),
			crel("th", total.iron),
			crel("th"),
			crel("th", totalCapacity),
		)
	);		

	let avgRes = (total.wood+total.stone+total.iron)/3;
	crel(content,
		crel("tr",
			crel("th", "To Average"),
			crel("th"),
			crel("th"),
			crel("th", Math.round(avgRes-total.wood)),
			crel("th"),
			crel("th"),
			crel("th", Math.round(avgRes-total.stone)),
			crel("th"),
			crel("th"),
			crel("th", Math.round(avgRes-total.iron))
		)
	);
}

function update() {
	setTimeout(update, 5000);
	let data = fetch("/data")
		.then(resp => {
			if (!resp.ok)
				throw new Error(resp.statusText);

			return resp.json();
		});
	let buildings = fetch("/data/buildings")
		.then(resp => {
			if(!resp.ok)
				throw new Error(resp.statusText);

			return resp.json();
		});
	Promise.all([data, buildings])
		.then(values => {
			let data = values[0];
			data.buildings = values[1];
			return data;
		})
		.then(data => {
			let content = document.getElementById("content");

			if(window.location.href.indexOf("#units") > -1) {
				updateUnits(content, data);
			} else if(window.location.href.indexOf("#production") > -1) {
				updateProduction(content, data);
			}
		});
}
update();
window.onhashchange = update;