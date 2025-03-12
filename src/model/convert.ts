import proj4 from "proj4";
import { latlon2xy, xy2latlon, xyzonejapan } from "./latlonxy";

const WGS84 = "+proj=longlat +datum=WGS84 +no_defs";
// 5系
const JPRCS_5 = "+proj=tmerc +lat_0=36 +lon_0=134.3333333333333 +k=0.9999 +x_0=0 +y_0=0 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs";

const zone = xyzonejapan(5);

/**
 * 平面直角座標5系 から 緯度経度への変換
 * @param latlng 平面直角座標5系の座標
 * @returns 緯度経度の座標
 */
export function toLatLng(xy: [number, number]) {
	return xy2latlon(xy[0], xy[1], zone);
}

/**
 * 緯度経度 から 平面直角座標5系への変換
 * @param latlng 緯度経度の座標
 * @returns 平面直角座標5系の座標
 */
export function fromLatLng(latlng: [number, number]): [number, number] {
	const result = latlon2xy(latlng[0], latlng[1], zone);
	return [result[0], result[1]];
}