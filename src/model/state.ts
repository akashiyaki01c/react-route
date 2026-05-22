import { Route } from "./route";

export class State {
	routes: Route[] = [];

	constructor(routes: Route[]) {
		this.routes = routes;
	}
}