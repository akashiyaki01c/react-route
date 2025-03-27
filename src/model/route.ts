/**
 * 一つの路線を表す
 */
export class Route {
	id = "";
	name = "";
	points: RoutePoint[] = [];
	stations: Station[] = [];

	constructor(name: string, points: RoutePoint[], stations: Station[]) {
		this.id = crypto.randomUUID();
		this.name = name || "";
		this.points = points || [];
		this.stations = stations || [];
	}
}

/**
 * 路線を構成する経由点を表す
 */
export class RoutePoint {
	/** 一意のID */
	id = "";
	/** 5系の座標 */
	chord: [number, number] = [0, 0];
	/** 端の点かどうか */
	isEdge = false;
	/** 曲線半径 */
	curveRadius = 300;

	constructor(chord: [number, number], isEdge: boolean, curveRadius: number) {
		this.id = crypto.randomUUID();
		this.chord = chord || [0, 0];
		this.isEdge = isEdge || false;
		this.curveRadius = curveRadius || 300;
	}
}

/**
 * 駅を表す
 */
export class Station {
	/** 一意のID */
	id = "";
	/** 駅名 */
	name = "";
	/** 距離程 */
	distance = 0;

	constructor(name: string, distance: number) {
		this.id = crypto.randomUUID();
		this.name = name || "";
		this.distance = distance || 0;
	}
}

export const TestRouteData: Route = new Route(
	"テスト",
	[],
	[]
);