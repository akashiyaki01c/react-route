import { create } from "zustand"
import { State } from "./model/state"
import { getDefaultRoute } from "./model/route";

const initialRoute = getDefaultRoute();

type RouteStore = {
	state: State,
	setState: (updater: (state: State) => State) => void,
	selectedRouteId: string;
	setSelectedRouteId: (id: string) => void,
	loadState: (state: State) => void,
}
export const useRouteStore = create<RouteStore>((set) => ({
	state: {
		routes: [
			initialRoute
		]
	},
	selectedRouteId: initialRoute.id,
	setState: (updater) => set((store) => ({ state: updater(store.state) })),
	setSelectedRouteId: (id) => set({ selectedRouteId: id }),
	loadState: (state) => {
		set(() => ({ state, selectedRouteId: state.routes[0].id }));

	}
}));

export const useSelectedRoute =
	() => {
		return useRouteStore((s) =>
			s.state.routes.find(
				r => r.id === s.selectedRouteId
			)!
		);
	};