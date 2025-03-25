import { latlon2xy, xy2latlon, xyzonejapan } from "./latlonxy";

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