import { create } from "zustand"
import { State } from "./model/state"
import { Route } from "./model/route";

type RouteStore = {
	state: State,
	setState: (state: State) => void,
}
export const useRouteStore = create<RouteStore>((set) => ({
	state: new State([
		new Route("新規路線", [], [])
	]),
	setState: (state: State) => set({ state }),
}));