package main

import (
	"encoding/json"
	"fmt"
	"io/ioutil"
	"net/http"
)

type myListener struct {
	current []byte
}

type data struct {
	Villages map[string]village
}

type village struct {
	Id         int
	Ressources ressources
	Units      units
}

type units map[string][]int

type ressources struct {
	Wood  int
	Stone int
	Iron  int
}

func (l *myListener) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	if r.Method == "POST" {

		b, err := ioutil.ReadAll(r.Body)
		defer r.Body.Close()
		if err != nil {
			http.Error(w, err.Error(), 500)
			return
		}

		// Unmarshal
		var msg data
		err = json.Unmarshal(b, &msg)
		if err != nil {
			http.Error(w, err.Error(), 500)
			return
		}

		l.current = b

		w.Header().Set("content-type", "application/json")

		fmt.Fprintln(w, "{\"status\":\"success\"}")
	} else if r.Method == "GET" {
		if r.URL.Path == "/data" {
			w.Write(l.current)
		} else {
			http.ServeFile(w, r, "index.html")
		}
	}
}

func main() {
	listener := &myListener{}
	http.ListenAndServe(":8084", listener)
}
