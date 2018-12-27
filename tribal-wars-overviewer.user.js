// ==UserScript==
// @name         Tribal-Wars Overviewer
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  try to take over the world!
// @author       You
// @match        https://*.die-staemme.de/game.php?village=*&screen=overview_villages&mode=*
// @require http://code.jquery.com/jquery-3.3.1.min.js
// @grant        GM.setValue
// @grant        GM.getValue
// ==/UserScript==

(function() {
    'use strict';

    var $ = window.jQuery;
    function parseNumber(element) {
        return +element[0].innerText.replace('.', "");
    }

    function parseRessources(villages, element) {
        let id = +$(element).find(".quickedit-vn")[0].attributes["data-id"].value;
        let village = villages[id] || {};
        let ressources = village.ressources || {};
        village.id = id;
        ressources.wood = parseNumber($(element).find(".wood"));
        ressources.stone = parseNumber($(element).find(".stone"));
        ressources.iron = parseNumber($(element).find(".iron"));
        village.ressources = ressources;
        villages[id]=village;
    }

    function parseUnits(villages, element) {
        let edit = $(element).find(".quickedit-vn")[0];
        let id = +edit.attributes["data-id"].value;
        let village = villages[id] || {};
        village.id = id;
        village.name = edit.innerText;
        let units = village.units || {};

        $(element).find('tr').each(function(i, type) {
            let troups = [];
            $(type).find('td.unit-item').each(function(iT, u) {
                troups.push(+u.innerText);
            });
            units[i] = troups;
        });
        village.units = units;
        villages[id]=village;
    }

    function parseBuildings(villages, element) {
        let id = +element.id.substring(2);
        let village = villages[id] || {};
        village.id = id;
        let buildings = village.buildings || {};

        $(element).find('td.upgrade_building').each(function(iB, b) {
            buildings[b.classList[1].substring(2)] = +b.innerText;
        });
        village.buildings = buildings;
        villages[id]=village;
    }

    function getId(text) {
        let idMatch = /id=\d+/;
        let matches = text.match(idMatch);
        if(matches == null) {
            return null;
        }

        return +matches[0].substring(3);
    }

    function parseTrades(villages, element) {
        let cells = $(element).find("td");
        let ressources = $(cells[8]).find(".nowrap");
        let info = {
            sender: getId(cells[1].innerHTML),
            senderVillage: getId(cells[2].innerHTML),
            receiver: getId(cells[3].innerHTML),
            receiverVillage: getId(cells[4].innerHTML),
            eda: cells[6].innerText.split(":").map((x, i) => (+x) * [60*60, 60, 1][i]).reduce((sum, c) => sum+c, 0),
            iron: 0,
            stone: 0,
            wood: 0,
        };

        ressources.each(function(i, r) {
            if(r.firstChild.classList.contains("wood")){
                info.wood = +r.innerText.replace('.', '');
            }
            if(r.firstChild.classList.contains("stone")){
                info.stone = +r.innerText.replace('.', '');
            }
            if(r.firstChild.classList.contains("iron")){
                info.iron = +r.innerText.replace('.', '');
            }
        });

        console.log(info);
    }

    GM.getValue("die_staemme", {}).then((data) => {
        var villages = data.villages || {};
        $("#production_table tr").each(function(i, e) {
            // HEADER
            if(i == 0) return;

            parseRessources(villages, e);
        });

        $("#units_table tbody").each(function(i, e) {
            parseUnits(villages, e);
        });

        $("#buildings_table tbody tr").each(function(i, e) {
            parseBuildings(villages, e);
        });

        $("#trades_table tr").each(function(i, e) {
            // HEADER
            if(i == 0) return;

            parseTrades(villages, e);
        });

        try {
            let totals= {ressources: {wood:0, stone: 0, iron: 0}, units: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]}
            for(let id in villages) {
            let village = villages[id];
            totals.ressources.wood += village.ressources.wood;
            totals.ressources.stone += village.ressources.stone;
            totals.ressources.iron += village.ressources.iron;

            for(let t in village.units) {
                if(t == 0) continue;

                totals.units = totals.units.map(function(c, i) {
                    return c + village.units[t][i];
                });
            }
        }
        console.log(totals);
        console.log(data);
        } catch(e) {
            console.log("invalid data");
        }

        data.villages = villages;
        fetch('http://localhost:8084/data', {
            method: "POST", // *GET, POST, PUT, DELETE, etc.
            mode: "no-cors", // no-cors, cors, *same-origin
            cache: "no-cache", // *default, no-cache, reload, force-cache, only-if-cached
            credentials: "same-origin", // include, *same-origin, omit
            headers: {
                "Content-Type": "application/json",
            },
            redirect: "follow", // manual, *follow, error
            referrer: "no-referrer", // no-referrer, *client
            body: JSON.stringify(data), // body data type must match "Content-Type" header
        });

        GM.setValue("die_staemme", data);
    });
})();