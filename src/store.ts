import { create } from "zustand"
import { State } from "./model/state"
import { getDefaultRoute } from "./model/route";

type RouteStore = {
	state: State,
	setState: (state: State) => void,
}
export const useRouteStore = create<RouteStore>((set) => ({
	state: {
		routes: [
			getDefaultRoute()
		]
	},
	setState: (state: State) => set({ state }),
}));