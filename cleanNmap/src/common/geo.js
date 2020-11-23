const { Headers } = require("node-fetch");
const fetch = require("node-fetch");
import { assert } from "../util/assert";
import * as config from "../../config.json";

export function getReverseGeoUrl(long, lat) {
    return `https://naveropenapi.apigw.ntruss.com/map-reversegeocode/v2/gc?request=coordsToaddr&coords=${long},${lat}&orders=legalcode,admcode,addr,roadaddr&output=json`;
}

export async function getReverseGeoObj(long, lat) {
    const myHeaders = new Headers({
        "X-NCP-APIGW-API-KEY-ID": config["X-NCP-APIGW-API-KEY-ID"],
        "X-NCP-APIGW-API-KEY": config["X-NCP-APIGW-API-KEY"]
    });
    const url = getReverseGeoUrl(long, lat);
    const response = await fetch(url, { method: "GET", headers: myHeaders });
    assert(response.ok, "Failed to fetch document");
    const obj = await response.json();
    console.log(obj.results);
}

export function getGeoUrl(addr) {
    return `https://naveropenapi.apigw.ntruss.com/map-geocode/v2/geocode?query=${addr}`;
}

export async function getGeoObj(addr) {
    const myHeaders = new Headers({
        "X-NCP-APIGW-API-KEY-ID": config["X-NCP-APIGW-API-KEY-ID"],
        "X-NCP-APIGW-API-KEY": config["X-NCP-APIGW-API-KEY"]
    });
    const url = getGeoUrl(msg);
    const response = await fetch(url, { method: "GET", headers: myHeaders });
    assert(response.ok, "Failed to fetch document");
    const obj = await response.json();
    console.log(obj.results);
}