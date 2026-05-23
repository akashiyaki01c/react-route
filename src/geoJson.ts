import { Feature, FeatureCollection, LineString } from "geojson";
import { toLatLng } from "./model/convert";
import { State } from "./model/state";
import { getCircleBeginPosition, getCircleCenterPosition, getCircleEndPosition, getShortestArc, isClockwise, normalizeAngle } from "./model/distance";

export function toGeoJSON(state: State) {
	return JSON.stringify({
		type: "FeatureCollection",
		features: state.routes
			.flatMap((route) => [
				route.points.length == 2
					? ({
						type: "Feature",
						geometry: {
							type: "LineString",
							coordinates: [
								toLatLng(route.points[0].coord).reverse(),
								toLatLng(route.points[1].coord).reverse(),
							],
						} satisfies LineString,
						properties: null,
					} satisfies Feature)
					: ({
						type: "Feature",
						geometry: {
							type: "LineString",
							coordinates: [],
						},
						properties: null,
					} satisfies Feature),
				route.points.length > 2
					? ({
						type: "Feature",
						geometry: {
							type: "LineString",
							coordinates: [
								toLatLng(route.points[0].coord).reverse(),
								toLatLng(
									getCircleBeginPosition(
										route.points[0].coord,
										route.points[1].coord,
										route.points[2].coord,
										route.points[1].curveRadius,
									),
								).reverse(),
							],
						} satisfies LineString,
						properties: null,
					} satisfies Feature)
					: ({
						type: "Feature",
						geometry: {
							type: "LineString",
							coordinates: [],
						},
						properties: null,
					} satisfies Feature),
				route.points.length > 2
					? ({
						type: "Feature",
						geometry: {
							type: "LineString",
							coordinates: [
								toLatLng(
									route.points[route.points.length - 1]
										.coord,
								).reverse(),
								toLatLng(
									getCircleEndPosition(
										route.points[route.points.length - 3]
											.coord,
										route.points[route.points.length - 2]
											.coord,
										route.points[route.points.length - 1]
											.coord,
										route.points[route.points.length - 2]
											.curveRadius,
									),
								).reverse(),
							],
						},
						properties: null,
					} satisfies Feature)
					: ({
						type: "Feature",
						geometry: {
							type: "LineString",
							coordinates: [],
						},
						properties: null,
					} satisfies Feature),
				...route.points
					.map((point, index) => {
						if (index === 0) return null;
						if (index === route.points.length - 1)
							return null;

						const before = route.points[index - 1];
						const after = route.points[index + 1];

						function getCircleChoord(
							pos0: [number, number],
							pos1: [number, number],
							pos2: [number, number],
							radius: number,
						): [number, number][] {
							const posCenter = getCircleCenterPosition(
								pos0,
								pos1,
								pos2,
								radius,
							);

							{
								const line: [number, number][] = [];
								const clockwise = isClockwise(
									pos0,
									pos1,
									pos2,
								);
								const angleOffset = clockwise
									? Math.PI / 2
									: -Math.PI / 2;

								const start = normalizeAngle(
									Math.atan2(
										pos0[0] - pos1[0],
										pos0[1] - pos1[1],
									) + angleOffset,
								);
								const end = normalizeAngle(
									Math.atan2(
										pos2[0] - pos1[0],
										pos2[1] - pos1[1],
									) - angleOffset,
								);
								const ACCURACY = 20;
								const arcAngle = getShortestArc(start, end);

								const add = arcAngle / ACCURACY;

								for (let i = 0; i <= ACCURACY; i++) {
									const angle = start + add * i;
									const addx = Math.sin(angle) * radius;
									const addy = Math.cos(angle) * radius;

									line.push(
										toLatLng([
											posCenter[0] + addx,
											posCenter[1] + addy,
										]).reverse() as [number, number],
									);
								}

								return line;
							}
						}
						return getCircleChoord(
							before.coord,
							point.coord,
							after.coord,
							point.curveRadius,
						);
					})
					.filter((v) => v)
					.map(
						(v) =>
							({
								type: "LineString",
								coordinates: v ?? [],
							}) satisfies LineString,
					)
					.map(
						(v) =>
							({
								type: "Feature",
								geometry: v,
								properties: null,
							}) satisfies Feature,
					),
				...route.points
					.map((point, i) => {
						if (i == 0 || i == 1) return;
						if (i == route.points.length - 1) return;

						const before2 = route.points[i - 2];
						const before = route.points[i - 1];
						const after = route.points[i + 1];

						return [
							toLatLng(
								getCircleEndPosition(
									before2.coord,
									before.coord,
									point.coord,
									before.curveRadius,
								),
							).reverse(),
							toLatLng(
								getCircleBeginPosition(
									before.coord,
									point.coord,
									after.coord,
									point.curveRadius,
								),
							).reverse(),
						];
					})
					.filter((v) => v)
					.map(
						(v) =>
							({
								type: "LineString",
								coordinates: v ?? [],
							}) satisfies LineString,
					)
					.map(
						(v) =>
							({
								type: "Feature",
								geometry: v,
								properties: null,
							}) satisfies Feature,
					),
			])
			.filter((v) => v != null),
	} satisfies FeatureCollection);
}
