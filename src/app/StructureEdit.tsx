import { Button, NumberInput, Select, TextInput } from "@mantine/core";
import { Route } from "../model/route";
import { useRouteStore, useSelectedRoute } from "../store";

export function StructureEdit() {
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
            構造物管理
          </span>
        </div>
        <div style={{ display: "flex", gap: "0.25em" }}>
          <Button
            variant="white"
            onClick={() => {
              updateSelectedRoute((route) => ({
                ...route,
                structures: route.structures.toSorted(
                  (a, b) => a.start - b.start,
                ),
              }));
            }}
          >
            構造物ソート
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              updateSelectedRoute((route) => ({
                ...route,
                structures: [
                  ...route.structures,
                  {
                    start: 0,
                    end: 0,
                    name: "",
                    type: "tunnel",
                  },
                ],
              }));
            }}
          >
            構造物追加
          </Button>
        </div>
      </div>
      <div
        style={{
          height: "10em",
          overflowY: "scroll",
          border: "1px black solid",
          padding: "2.5%",
          gap: "1em",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {selectedRoute.structures.map((structure, index) => (
          <div
            key={structure.name}
            style={{
              display: "flex",
              justifyContent: "space-between",
            }}
          >
            <div
              style={{ display: "flex", gap: "0.5em", flexDirection: "column" }}
            >
              <div
                style={{ display: "flex", gap: "0.5em", justifyContent: "end" }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.25em",
                  }}
                >
                  構造物名
                  <TextInput
                    style={{ width: "8ric" }}
                    type="text"
                    value={structure.name}
                    onChange={(e) => {
                      updateSelectedRoute((route) => ({
                        ...route,
                        structures: route.structures.map((v, i) =>
                          i === index ? { ...v, name: e.target.value } : v,
                        ),
                      }));
                    }}
                  />
                </div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.25em",
                  }}
                >
                  種類
                  <Select
                    style={{ width: "6ric" }}
                    data={["tunnel", "bridge"]}
                    value={structure.type}
                    onChange={(e) => {
                      updateSelectedRoute((route) => ({
                        ...route,
                        structures: route.structures.map((v, i) =>
                          i === index ? { ...v, type: e || "tunnel" } : v,
                        ),
                      }));
                    }}
                  />
                </div>
              </div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.25em",
                  justifyContent: "end",
                }}
              >
                距離程
                <NumberInput
                  style={{ width: "6ric" }}
                  value={structure.start}
                  onValueChange={(e) => {
                    updateSelectedRoute((route) => ({
                      ...route,
                      structures: route.structures.map((v, i) =>
                        i === index
                          ? {
                              ...v,
                              start: Number.parseInt(e.formattedValue) || 0,
                            }
                          : v,
                      ),
                    }));
                  }}
                />
                m -
                <NumberInput
                  style={{ width: "6ric" }}
                  value={structure.end}
                  onValueChange={(e) => {
                    updateSelectedRoute((route) => ({
                      ...route,
                      structures: route.structures.map((v, i) =>
                        i === index
                          ? {
                              ...v,
                              end: Number.parseInt(e.formattedValue) || 0,
                            }
                          : v,
                      ),
                    }));
                  }}
                />
                m
              </div>
            </div>
            <Button
              variant="outline"
              onClick={() => {
                updateSelectedRoute((route) => ({
                  ...route,
                  structures: route.structures.filter((_, i) => i !== index),
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
