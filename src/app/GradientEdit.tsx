import { Button, NumberInput } from "@mantine/core";
import { Route } from "../model/route";
import { State } from "../model/state";

interface Props {
  routes: Route[];
  selectedRoute: Route;
  setState: (state: State) => void;
  setSelectedRoute: React.Dispatch<React.SetStateAction<Route>>;
}

export function GradientEdit(props: Props) {
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
              props.selectedRoute.gradients =
                props.selectedRoute.gradients.sort(
                  (a, b) => a.position - b.position,
                );
              props.setSelectedRoute({ ...props.selectedRoute });
            }}
          >
            勾配ソート
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              props.selectedRoute.gradients.push({
                position: 0,
                value: 0,
              });
              props.setSelectedRoute({ ...props.selectedRoute });
            }}
          >
            勾配追加
          </Button>
        </div>
      </div>
	  <div style={{display: "flex", alignItems: "center", gap: "0.5em", paddingLeft: "1em"}}>
          開始標高
          <NumberInput
            style={{ width: "6ric" }}
            value={props.selectedRoute.startEvelation}
            onValueChange={(e) => {
              props.selectedRoute.startEvelation = Number.parseInt(e.formattedValue) || 0;
              props.setSelectedRoute({ ...props.selectedRoute });
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
        {props.selectedRoute.gradients.map((crossing, index) => (
          <div
            key={crossing.position}
            style={{ display: "flex", justifyContent: "space-between" }}
          >
            <div style={{ display: "flex", gap: "0.5em" }}>
              <div
                style={{ display: "flex", alignItems: "center", gap: "0.25em" }}
              >
                距離程
                <NumberInput
                  style={{ width: "6ric" }}
                  value={crossing.position}
                  onValueChange={(e) => {
                    crossing.position = Number.parseInt(e.formattedValue) || 0;
                    props.setSelectedRoute({ ...props.selectedRoute });
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
                  value={crossing.value}
                  onValueChange={(e) => {
                    crossing.value = Number.parseInt(e.formattedValue) || 0;
                    props.setSelectedRoute({ ...props.selectedRoute });
                  }}
                />
                ‰
              </div>
            </div>
            <Button
              variant="outline"
              onClick={() => {
                props.selectedRoute.gradients =
                  props.selectedRoute.gradients.filter((_, i) => i !== index);
                props.setSelectedRoute({ ...props.selectedRoute });
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
