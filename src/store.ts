import { create } from "zustand"
import { State } from "./model/state"

type RouteStore = {
	state: State,
	setState: (state: State) => void,
}
export const useRouteStore = create<RouteStore>((set) => ({
	state: {
		routes: [
			{
				id: crypto.randomUUID(),
				name: "新規路線",
				points: [],
				stations: []
			}
		]
	},
	setState: (state: State) => set({ state }),
}));