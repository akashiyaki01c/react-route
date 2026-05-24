import { Button, NumberInput, Select, TextInput } from "@mantine/core";
import { Route } from "../model/route";
import { State } from "../model/state";

interface Props {
  routes: Route[];
  selectedRoute: Route;
  setState: (state: State) => void;
  setSelectedRoute: React.Dispatch<React.SetStateAction<Route>>;
}

export function StructureEdit(props: Props) {
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
              props.selectedRoute.structures =
                props.selectedRoute.structures.sort(
                  (a, b) => a.start - b.start,
                );
              props.setSelectedRoute({ ...props.selectedRoute });
            }}
          >
            構造物ソート
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              props.selectedRoute.structures.push({
                start: 0,
                end: 0,
                name: "",
                type: "tunnel",
              });
              props.setSelectedRoute({ ...props.selectedRoute });
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
		  flexDirection: "column"
        }}
      >
        {props.selectedRoute.structures.map((structure, index) => (
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
                      structure.name = e.target.value;
                      props.setSelectedRoute(
                        structuredClone(props.selectedRoute),
                      );
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
                      structure.type = e || "tunnel";
                      props.setSelectedRoute(
                        structuredClone(props.selectedRoute),
                      );
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
                    structure.start = Number.parseInt(e.formattedValue) || 0;
                    props.setSelectedRoute(
                      structuredClone(props.selectedRoute),
                    );
                  }}
                />
                m -
                <NumberInput
                  style={{ width: "6ric" }}
                  value={structure.end}
                  onValueChange={(e) => {
                    structure.end = Number.parseInt(e.formattedValue) || 0;
                    props.setSelectedRoute(
                      structuredClone(props.selectedRoute),
                    );
                  }}
                />
                m
              </div>
            </div>
            <Button
              variant="outline"
              onClick={() => {
                props.selectedRoute.structures =
                  props.selectedRoute.structures.filter((_, i) => i !== index);
                props.setSelectedRoute(structuredClone(props.selectedRoute));
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
