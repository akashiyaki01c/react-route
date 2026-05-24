import { Button, NumberInput } from "@mantine/core";
import { Route } from "../model/route";
import { useRouteStore, useSelectedRoute } from "../store";

export function GradientEdit() {
  const { setState } = useRouteStore();
  const selectedRoute = useSelectedRoute();
  const updateSelectedRoute = (updater: (route: Route) => Route) => {
    setState((state) => ({
      ...state,
      routes: state.routes.map((route) =>
        route.id === selectedRoute.id ? updater(route) : route,
      ),
    }));
  };

  return (
    <div
      style={{
        height: "25%",
        display: "flex",
        gap: "0.25em",
        flexDirection: "column",
      }}
    >
      <div
        style={{
          height: "20%",
          display: "flex",
          justifyContent: "space-between",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
          }}
        >
          <span style={{ marginInline: "1ric", fontWeight: "bold" }}>
            勾配管理
          </span>
        </div>
        <div style={{ display: "flex", gap: "0.25em" }}>
          <Button
            variant="white"
            onClick={() => {
              updateSelectedRoute((route) => ({
                ...route,
                gradients: route.gradients.toSorted(
                  (a, b) => a.position - b.position,
                ),
              }));
            }}
          >
            勾配ソート
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              updateSelectedRoute((route) => ({
                ...route,
                gradients: [
                  ...route.gradients,
                  {
                    position: 0,
                    value: 0,
                  },
                ],
              }));
            }}
          >
            勾配追加
          </Button>
        </div>
      </div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.5em",
          paddingLeft: "1em",
        }}
      >
        開始標高
        <NumberInput
          style={{ width: "6ric" }}
          value={selectedRoute.startEvelation}
          onValueChange={(e) => {
            updateSelectedRoute((route) => ({
              ...route,
              startEvelation: Number.parseInt(e.formattedValue) || 0,
            }));
          }}
        />
        m
      </div>
      <div
        style={{
          height: "10em",
          overflowY: "scroll",
          border: "1px black solid",
          padding: "2.5%",
        }}
      >
        {selectedRoute.gradients.map((gradient, index) => (
          <div
            key={gradient.position}
            style={{ display: "flex", justifyContent: "space-between" }}
          >
            <div style={{ display: "flex", gap: "0.5em" }}>
              <div
                style={{ display: "flex", alignItems: "center", gap: "0.25em" }}
              >
                距離程
                <NumberInput
                  style={{ width: "6ric" }}
                  value={gradient.position}
                  onValueChange={(e) => {
                    updateSelectedRoute((route) => ({
                      ...route,
                      gradients: route.gradients.map((v, i) =>
                        i === index
                          ? {
                              ...v,
                              position: Number.parseInt(e.formattedValue) || 0,
                            }
                          : v,
                      ),
                    }));
                  }}
                />
                m
              </div>
              <div
                style={{ display: "flex", alignItems: "center", gap: "0.25em" }}
              >
                勾配
                <NumberInput
                  style={{ width: "6ric" }}
                  value={gradient.value}
                  onValueChange={(e) => {
                    updateSelectedRoute((route) => ({
                      ...route,
                      gradients: route.gradients.map((v, i) =>
                        i === index
                          ? {
                              ...v,
                              value: Number.parseInt(e.formattedValue) || 0,
                            }
                          : v,
                      ),
                    }));
                  }}
                />
                ‰
              </div>
            </div>
            <Button
              variant="outline"
              onClick={() => {
                updateSelectedRoute((route) => ({
                  ...route,
                  gradients: route.gradients.filter((_, i) => i !== index),
                }));
              }}
            >
              削除
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
