import { RoutePoint } from "./route";

// 曲線の中心座標を求める関数
export function getCircleCenterPosition(pos0: [number, number], pos1: [number, number], pos2: [number, number], radius: number): [number, number] {
	let angle0 = Math.atan2(pos1[0] - pos0[0], pos1[1] - pos0[1]) - 90 * Math.PI / 180;
	let angle1 = Math.atan2(pos1[0] - pos2[0], pos1[1] - pos2[1]) - 90 * Math.PI / 180;
	let anglehalf = ((angle0 + angle1) / 2) % 360;

	let length = 1 / Math.sin(Math.abs(angle1 - angle0) / 2) * radius;

	let addx = length * Math.cos(anglehalf);
	let addy = length * Math.sin(anglehalf);

	if ((Math.abs(angle1 - angle0) / Math.PI * 180) < 180) {
		addx = -addx;
		addy = -addy;
	}

	return [pos1[0] + addx, pos1[1] - addy];
}

// 曲線の始点座標を求める関数
export function getCircleBeginPosition(pos0: [number, number], pos1: [number, number], pos2: [number, number], radius: number): [number, number] {
	const center = getCircleCenterPosition(pos0, pos1, pos2, radius);
	const clockwise = isClockwise(pos0, pos1, pos2);
	let angleOffset = clockwise ? Math.PI / 2 : -Math.PI / 2;
	let start = normalizeAngle(Math.atan2(pos0[0] - pos1[0], pos0[1] - pos1[1]) + angleOffset);
	let addx = Math.sin(start) * radius;
	let addy = Math.cos(start) * radius;

	return [center[0] + addx, center[1] + addy];
}

// 曲線の終点座標を求める関数
export function getCircleEndPosition(pos0: [number, number], pos1: [number, number], pos2: [number, number], radius: number): [number, number] {
	const center = getCircleCenterPosition(pos0, pos1, pos2, radius);
	const clockwise = isClockwise(pos0, pos1, pos2);
	let angleOffset = clockwise ? Math.PI / 2 : -Math.PI / 2;
	let start = normalizeAngle(Math.atan2(pos2[0] - pos1[0], pos2[1] - pos1[1]) - angleOffset);
	let addx = Math.sin(start) * radius;
	let addy = Math.cos(start) * radius;
	return [center[0] + addx, center[1] + addy];
}
export function normalizeAngle(angle: number): number {
	while (angle > Math.PI) angle -= 2 * Math.PI;
	while (angle < -Math.PI) angle += 2 * Math.PI;
	return angle;
}
export function getShortestArc(start: number, end: number): number {
	let diff = normalizeAngle(end) - normalizeAngle(start);
	if (diff > Math.PI) {
		diff -= Math.PI * 2; // 長い弧を避ける
	} else if (diff < -Math.PI) {
		diff += Math.PI * 2; // 長い弧を避ける
	}
	return diff;
}
export function isClockwise(pos0: [number, number], pos1: [number, number], pos2: [number, number]): boolean {
	const cross = (pos1[0] - pos0[0]) * (pos2[1] - pos0[1]) - (pos1[1] - pos0[1]) * (pos2[0] - pos0[0]);
	return cross < 0; // 時計回りならtrue、反時計回りならfalse
}

function getLineDistance(pos1: [number, number], pos2: [number, number]) {
	return Math.sqrt((pos2[0] - pos1[0])**2 + (pos2[1] - pos1[1])**2);
}
function getAngle(pos0: [number, number], pos1: [number, number], pos2: [number, number]) {
	const vecA = [pos0[0]-pos1[0], pos0[1]-pos1[1]];
	const vecB = [pos2[0]-pos1[0], pos2[1]-pos1[1]];

	const cosTheta = (vecA[0]*vecB[0] + vecA[1]*vecB[1]) / (Math.sqrt(vecA[0]**2 + vecA[1]**2) * Math.sqrt(vecB[0]**2 + vecB[1]**2));
	return Math.acos(cosTheta);
}
function getCurveDistance(pos0: [number, number], pos1: [number, number], pos2: [number, number], curveRadius: number) {
	const angle = getAngle(pos0, pos1, pos2);

	return curveRadius * (Math.PI - angle);
}

export function GetCurveBeginDistance(points: RoutePoint[], index: number) {
	let totalDistance = 0;
	if (index == 0) {
		return 0;
	}
	if (points.length == 3) {
		const point = points[0];
		const nextPoint = points[1];
		const nextNextPoint = points[2];

		const nextCurveBeginPoint = getCircleBeginPosition(point.chord, nextPoint.chord, nextNextPoint.chord, nextPoint.curveRadius);

		totalDistance += getLineDistance(point.chord, nextCurveBeginPoint);
		return totalDistance;
	}
	for (let i = 0; i < index; i++) {
		if (i == 0) {
			const point = points[i];
			const nextPoint = points[i + 1];
			const nextNextPoint = points[i + 2];

			const nextCurveBeginPoint = getCircleBeginPosition(point.chord, nextPoint.chord, nextNextPoint.chord, nextPoint.curveRadius);
			totalDistance += getLineDistance(point.chord, nextCurveBeginPoint);

			totalDistance += getCurveDistance(point.chord, nextPoint.chord, nextNextPoint.chord, nextPoint.curveRadius);
		} else if (i == index-1) {
			const beforePoint = points[i - 1];
			const point = points[i];
			const nextPoint = points[i + 1];
			const nextNextPoint = points[i + 2];

			const currentCurveEndPoint = getCircleEndPosition(beforePoint.chord, point.chord, nextPoint.chord, point.curveRadius);
			const nextCurveBeginPoint = getCircleBeginPosition(point.chord, nextPoint.chord, nextNextPoint.chord, nextPoint.curveRadius);
			totalDistance += getLineDistance(currentCurveEndPoint, nextCurveBeginPoint);
		} else {
			const beforePoint = points[i - 1];
			const point = points[i];
			const nextPoint = points[i + 1];
			const nextNextPoint = points[i + 2];

			const currentCurveEndPoint = getCircleEndPosition(beforePoint.chord, point.chord, nextPoint.chord, point.curveRadius);
			const nextCurveBeginPoint = getCircleBeginPosition(point.chord, nextPoint.chord, nextNextPoint.chord, nextPoint.curveRadius);
			totalDistance += getLineDistance(currentCurveEndPoint, nextCurveBeginPoint);

			totalDistance += getCurveDistance(point.chord, nextPoint.chord, nextNextPoint.chord, nextPoint.curveRadius);
		}
	}
	return totalDistance;
}

export function GetCurveEndDistance(points: RoutePoint[], index: number) {
	let totalDistance = 0;
	if (index == 0) {
		return 0;
	}
	if (points.length == 3) {
		const point = points[0];
		const nextPoint = points[1];
		const nextNextPoint = points[2];

		const nextCurveBeginPoint = getCircleBeginPosition(point.chord, nextPoint.chord, nextNextPoint.chord, nextPoint.curveRadius);

		totalDistance += getLineDistance(point.chord, nextCurveBeginPoint);
		totalDistance += getCurveDistance(point.chord, nextPoint.chord, nextNextPoint.chord, nextPoint.curveRadius);

		return totalDistance;
	}
	for (let i = 0; i < index; i++) {
		if (i == 0) {
			const point = points[i];
			const nextPoint = points[i + 1];
			const nextNextPoint = points[i + 2];

			const nextCurveBeginPoint = getCircleBeginPosition(point.chord, nextPoint.chord, nextNextPoint.chord, nextPoint.curveRadius);
			totalDistance += getLineDistance(point.chord, nextCurveBeginPoint);

			totalDistance += getCurveDistance(point.chord, nextPoint.chord, nextNextPoint.chord, nextPoint.curveRadius);
		} else if (i == index - 1) {
			const beforePoint = points[i - 1];
			const point = points[i];
			const nextPoint = points[i + 1];
			const nextNextPoint = points[i + 2];

			const currentCurveEndPoint = getCircleEndPosition(beforePoint.chord, point.chord, nextPoint.chord, point.curveRadius);
			const nextCurveBeginPoint = getCircleBeginPosition(point.chord, nextPoint.chord, nextNextPoint.chord, nextPoint.curveRadius);
			totalDistance += getLineDistance(currentCurveEndPoint, nextCurveBeginPoint);

			totalDistance += getCurveDistance(point.chord, nextPoint.chord, nextNextPoint.chord, nextPoint.curveRadius);
		} else {
			const beforePoint = points[i - 1];
			const point = points[i];
			const nextPoint = points[i + 1];
			const nextNextPoint = points[i + 2];

			const currentCurveEndPoint = getCircleEndPosition(beforePoint.chord, point.chord, nextPoint.chord, point.curveRadius);
			const nextCurveBeginPoint = getCircleBeginPosition(point.chord, nextPoint.chord, nextNextPoint.chord, nextPoint.curveRadius);
			totalDistance += getLineDistance(currentCurveEndPoint, nextCurveBeginPoint);

			totalDistance += getCurveDistance(point.chord, nextPoint.chord, nextNextPoint.chord, nextPoint.curveRadius);
		}
	}
	return totalDistance;
}

// pointsを結んだ合計距離を求める関数
export function GetTotalDistance(points: RoutePoint[]) {
	let totalDistance = 0;
	if (points.length == 0) return 0;
	if (points.length == 1) return 0;
	if (points.length == 2) {
		totalDistance = getLineDistance(points[0].chord, points[1].chord);
		return totalDistance;
	}
	if (points.length == 3) {
		const point = points[0];
		const nextPoint = points[1];
		const nextNextPoint = points[2];

		const nextCurveBeginPoint = getCircleBeginPosition(point.chord, nextPoint.chord, nextNextPoint.chord, nextPoint.curveRadius);
		const nextCurveEndPoint = getCircleEndPosition(point.chord, nextPoint.chord, nextNextPoint.chord, nextPoint.curveRadius);

		totalDistance += getLineDistance(point.chord, nextCurveBeginPoint);
		totalDistance += getCurveDistance(point.chord, nextPoint.chord, nextNextPoint.chord, nextPoint.curveRadius);
		totalDistance += getLineDistance(nextCurveEndPoint, nextNextPoint.chord);

		return totalDistance;
	}

	for (let i = 0; i < points.length-1; i++) {
		if (i == 0) {
			const point = points[i];
			const nextPoint = points[i + 1];
			const nextNextPoint = points[i + 2];

			const nextCurveBeginPoint = getCircleBeginPosition(point.chord, nextPoint.chord, nextNextPoint.chord, nextPoint.curveRadius);
			totalDistance += getLineDistance(point.chord, nextCurveBeginPoint);

			totalDistance += getCurveDistance(point.chord, nextPoint.chord, nextNextPoint.chord, nextPoint.curveRadius);
		} else if (i == points.length-2) {
			const beforePoint = points[i - 1];
			const point = points[i];
			const nextPoint = points[i + 1];

			const currentCurveEndPoint = getCircleEndPosition(beforePoint.chord, point.chord, nextPoint.chord, point.curveRadius);
			totalDistance += getLineDistance(currentCurveEndPoint, nextPoint.chord);
		} else {
			const beforePoint = points[i - 1];
			const point = points[i];
			const nextPoint = points[i + 1];
			const nextNextPoint = points[i + 2];

			const currentCurveEndPoint = getCircleEndPosition(beforePoint.chord, point.chord, nextPoint.chord, point.curveRadius);
			const nextCurveBeginPoint = getCircleBeginPosition(point.chord, nextPoint.chord, nextNextPoint.chord, nextPoint.curveRadius);
			totalDistance += getLineDistance(currentCurveEndPoint, nextCurveBeginPoint);

			totalDistance += getCurveDistance(point.chord, nextPoint.chord, nextNextPoint.chord, nextPoint.curveRadius);
		}
	}

	return totalDistance;
}

export function GetLatLngFromDistance(points: RoutePoint[], distance: number): [number, number] {
	for (let i = 1; i < points.length - 1; i++) {
		const curveStartDistance = GetCurveBeginDistance(points, i);
		if (distance < curveStartDistance) {
			console.log(curveStartDistance, "に存在");
			// 直線内に存在
			const beforeEndDistance = GetCurveEndDistance(points, i-1);
			const proper = (distance - beforeEndDistance) / (curveStartDistance - beforeEndDistance);
			let pos0 = getCircleEndPosition(points[i-1].chord, points[i].chord, points[i+1].chord, points[i].curveRadius);
			let pos1 = getCircleBeginPosition(points[i].chord, points[i+1].chord, points[i+2].chord, points[i].curveRadius);

			return [
				pos0[0] * (1-proper) + pos1[0] * (proper),
				pos0[1] * (1-proper) + pos1[1] * (proper),
			];
		}
		const curveEndDistance = GetCurveEndDistance(points, i);
		if (distance < curveEndDistance) {
			console.log(curveEndDistance, "に存在");
			// 円弧内に存在
			const pos0 = points[i].chord, pos1 = points[i+1].chord, pos2 = points[i+2].chord;

			const clockwise = isClockwise(pos0, pos1, pos2);
			let angleOffset = clockwise ? Math.PI / 2 : -Math.PI / 2;

			const proper = (distance - curveStartDistance) / (curveEndDistance - curveStartDistance);

			let start = normalizeAngle(Math.atan2(pos0[0] - pos1[0], pos0[1] - pos1[1]) + angleOffset);
			let end = normalizeAngle(Math.atan2(pos2[0] - pos1[0], pos2[1] - pos1[1]) - angleOffset);
			const arcAngle = getShortestArc(start, end);

			let angle = start + (arcAngle * proper);

			const pos = getCircleCenterPosition(pos0, pos1, pos2, points[i+1].curveRadius);
			console.log(proper)
			return [
				pos[0] + Math.sin(angle) * points[i+1].curveRadius,
				pos[1] + Math.cos(angle) * points[i+1].curveRadius
			]
		}
	}
	return [0, 0]
}