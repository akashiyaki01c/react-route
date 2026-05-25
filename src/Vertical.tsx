import { useMemo, useRef } from "react";
import "./App.css";
import { Curve, Gradient, Route } from "./model/route";
import {
  GetCurveBeginDistance,
  GetCurveEndDistance,
  GetIA,
} from "./model/distance";
import { useSelectedRoute } from "./store";

const roundUpMultiple = (value: number, multiple: number): number =>
  Math.ceil(value / multiple) * multiple;
const roundDownMultiple = (value: number, multiple: number): number =>
  Math.floor(value / multiple) * multiple;
const getDistanceStrShort = (distance: number) => {
  const rawKilo = distance / 1000;
  const kilo = Math.floor(rawKilo);
  const meter = Math.floor(distance % 1000);

  return `${kilo}K${meter.toString().padStart(3, "0")}M`;
};
const getHataage = (
  x: number,
  y: number,
  upperStr: string,
  lowerStr: string,
) => {
  const length = 3 * 10;
  const deg = 30;

  return (
    <>
      <g className="hataage">
        <path
          d={`M ${x} ${y} L ${x + Math.cos((deg / 180) * Math.PI) * length} ${y - Math.sin((deg / 180) * Math.PI) * length}`}
          stroke="black"
          fill="transparent"
          strokeWidth={0.5}
        />
        <text
          x={x + (Math.cos((deg / 180) * Math.PI) * length) / 2}
          y={y - (Math.sin((deg / 180) * Math.PI) * length) / 2 - 2}
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize={3}
          fontFamily="monospace"
          transform={`rotate(-${deg}, ${x + (Math.cos((deg / 180) * Math.PI) * length) / 2}, ${y - (Math.sin((deg / 180) * Math.PI) * length) / 2})`}
        >
          {upperStr}
        </text>
        <text
          x={x + (Math.cos((deg / 180) * Math.PI) * length) / 2}
          y={y - (Math.sin((deg / 180) * Math.PI) * length) / 2 + 2}
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize={3}
          fontFamily="monospace"
          transform={`rotate(-${deg}, ${x + (Math.cos((deg / 180) * Math.PI) * length) / 2}, ${y - (Math.sin((deg / 180) * Math.PI) * length) / 2})`}
        >
          {lowerStr}
        </text>
      </g>
    </>
  );
};

const getCurves = (selectedRoute: Route) => {
  return selectedRoute.points
    .map((point, index) => {
      const isEdge = index == 0 || index == selectedRoute.points.length - 1;
      if (isEdge) {
        return null;
      }
      const bc = GetCurveBeginDistance(selectedRoute.points, index);
      const ec = GetCurveEndDistance(selectedRoute.points, index);
      const ia = GetIA(
        selectedRoute.points[index - 1].coord,
        selectedRoute.points[index].coord,
        selectedRoute.points[index + 1].coord,
      );
      const radius = point.curveRadius;

      return {
        start: Math.floor(bc),
        end: Math.floor(ec),
        direction: ia.direction as "left" | "right",
        // ia: ia.ia,
        radius,
        speed: 0,
      } satisfies Curve;
    })
    .filter((v) => v !== null);
};

interface Props {
  pointerDistance: number;
  setPointerDistance: React.Dispatch<React.SetStateAction<number>>;
}
export function Vertical({ pointerDistance, setPointerDistance }: Props) {
  const selectedRoute = useSelectedRoute();

  const svgRef = useRef<SVGSVGElement>(null);
  const curves = useMemo(() => getCurves(selectedRoute), [selectedRoute]);

  const xScale = 4;
  const yScale = 0.5;
  const marginEdge = 50;
  const startZ = selectedRoute.startEvelation;

  const startDistance = useMemo(
    () => roundDownMultiple(selectedRoute.terrains[0]?.distance || 0, 10),
    [selectedRoute.terrains],
  );
  const endDistance = useMemo(
    () =>
      roundUpMultiple(
        selectedRoute.terrains[selectedRoute.terrains.length - 1]?.distance ||
          0,
        10,
      ),
    [selectedRoute.terrains],
  );
  const lowerZ = useMemo(
    () =>
      roundDownMultiple(
        selectedRoute.terrains.filter(v => v.z !== -9999).reduce(
          (p, c) => Math.min(p, c.z),
          Number.MAX_VALUE,
        ) || 0,
        10,
      ) - 20,
    [selectedRoute.terrains],
  );
  const higherZ = useMemo(
    () =>
      roundUpMultiple(
        selectedRoute.terrains.filter(v => v.z !== -9999).reduce(
          (p, c) => Math.max(p, c.z),
          Number.MIN_VALUE,
        ) || 0,
        10,
      ) + 20,
    [selectedRoute.terrains],
  );

  /* const handleDownload = () => {
    if (!svgRef.current) return;

    const svgData = svgRef.current.outerHTML;
    const blob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "image.svg";
    a.click();

    URL.revokeObjectURL(url);
  }; */

  /// 地形
  const terrainElements = useMemo(() => {
    const getTerrainXCoord = (distance: number) =>
      (distance - startDistance) / xScale;
    const getTerrainYCoord = (distance: number) =>
      (higherZ - distance - lowerZ) / yScale;

    const result = [];
    const terrainPath =
      `M ${getTerrainXCoord(selectedRoute.terrains[0]?.distance)},${getTerrainYCoord(selectedRoute.terrains[0]?.z)} L` +
      selectedRoute.terrains
        .slice(1)
        .map((v) => `${getTerrainXCoord(v.distance)},${getTerrainYCoord(v.z)}`)
        .join(" ");
    result.push(
      <path
        d={terrainPath}
        stroke="black"
        fill="transparent"
        strokeWidth={0.5}
      />,
    );

    for (let i = startDistance; i < endDistance; i += 20) {
      const target = selectedRoute.terrains.find((v) => v.distance === i);
      if (!target) {
        continue;
      }
      result.push(
        <path
          d={`M ${getTerrainXCoord(i)},${getTerrainYCoord(target.z)} V ${getTerrainYCoord(lowerZ)}`}
          stroke="black"
          fill="transparent"
          strokeWidth={0.5}
        ></path>,
      );
    }
    return result;
  }, [endDistance, higherZ, lowerZ, selectedRoute.terrains, startDistance]);

  /// 軌条面
  const railElement = useMemo(() => {
    const getTerrainXCoord = (distance: number) =>
      (distance - startDistance) / xScale;
    const getTerrainYCoord = (distance: number) =>
      (higherZ - distance - lowerZ) / yScale;

    let railPath = "";
    {
      let currentZ = startZ;
      let currentDistance = startDistance;
      const coords = [];
      coords.push(
        `M ${getTerrainXCoord(startDistance)} ${getTerrainYCoord(currentZ)}`,
      );
      const g = [
        {
          position: startDistance,
          value: 0,
        } satisfies Gradient,
        ...selectedRoute.gradients,
        {
          position: endDistance,
          value: 0,
        } satisfies Gradient,
      ];
      for (let i = 1; i < g.length; i++) {
        const before = g[i - 1];
        const current = g[i];

        const length = current.position - before.position;
        currentDistance += length;
        const diffZ = (before.value * length) / 1000;
        currentZ += diffZ;

        coords.push(
          `L ${getTerrainXCoord(currentDistance)} ${getTerrainYCoord(currentZ)}`,
        );
      }
      railPath = coords.join(" ");
    }
    return (
      <path d={railPath} stroke="black" fill="transparent" strokeWidth={1} />
    );
  }, [
    endDistance,
    higherZ,
    lowerZ,
    selectedRoute.gradients,
    startDistance,
    startZ,
  ]);

  /// 駅関係
  const stationElements = useMemo(() => {
    const getTerrainXCoord = (distance: number) =>
      (distance - startDistance) / xScale;
    const getTerrainYCoord = (distance: number) =>
      (higherZ - distance - lowerZ) / yScale;

    const result = [];
    for (const sta of selectedRoute.stations) {
      const staZ =
        selectedRoute.terrains.find(
          (v) => v.distance === Math.floor(sta.distance),
        )?.z || 0;
      result.push(
        <path
          d={`M ${getTerrainXCoord(sta.distance)} ${getTerrainYCoord(lowerZ)} V ${getTerrainYCoord(staZ + 30)}`}
          stroke="black"
          fill="transparent"
          strokeWidth={0.5}
        ></path>,
      );
      result.push(
        <circle
          cx={getTerrainXCoord(sta.distance)}
          cy={getTerrainYCoord(staZ + 20)}
          r={5}
          stroke="black"
          fill="transparent"
          strokeWidth={0.5}
        ></circle>,
      );
      result.push(
        getHataage(
          getTerrainXCoord(sta.distance),
          getTerrainYCoord(staZ + 30),
          `${sta.name || sta.name}停車場中心`,
          getDistanceStrShort(sta.distance),
        ),
      );
    }
    return result;
  }, [
    higherZ,
    lowerZ,
    selectedRoute.stations,
    selectedRoute.terrains,
    startDistance,
  ]);

  /// 構造物関係
  const structuresElements = useMemo(() => {
    const getTerrainXCoord = (distance: number) =>
      (distance - startDistance) / xScale;
    const getTerrainYCoord = (distance: number) =>
      (higherZ - distance - lowerZ) / yScale;
    function getEveration(distance: number): {
      everation: number;
      gradient: number;
    } {
      if (distance >= endDistance) {
        return { everation: 0, gradient: 0 };
      }

      let everation = startZ;
      let gradient = 0;
      for (let i = 0; i < distance; i++) {
        everation += gradient / 1000;

        const gradientChange = selectedRoute.gradients.find(
          (v) => v.position === i,
        );
        if (gradientChange) {
          gradient = gradientChange.value;
        }
      }

      return { everation, gradient };
    }

    const result = [];
    for (const structure of selectedRoute.structures) {
      const points = [];
      const everation = getEveration(structure.start);
      let nowHeight = everation.everation;
      let nowGradient = everation.gradient;

      let plusValue = 0;
      switch (structure.type) {
        case "bridge":
          plusValue = -1;
          break;
        case "tunnel":
          plusValue = 5;
          break;
      }

      points.push(
        `M ${getTerrainXCoord(structure.start)} ${getTerrainYCoord(nowHeight)}`,
      );
      points.push(
        `L ${getTerrainXCoord(structure.start)} ${getTerrainYCoord(nowHeight + plusValue)}`,
      );
      for (let i = structure.start; i < structure.end; i++) {
        nowHeight += (1 / 1000) * (nowGradient || 0);
        points.push(
          `L ${getTerrainXCoord(i)} ${getTerrainYCoord(nowHeight + plusValue)}`,
        );

        const gradientChange = selectedRoute.gradients.find(
          (v) => v.position === i,
        );
        if (gradientChange) {
          nowGradient = gradientChange.value;
        }
      }
      points.push(
        `L ${getTerrainXCoord(structure.end)} ${getTerrainYCoord(nowHeight + plusValue)}`,
      );
      points.push(
        `L ${getTerrainXCoord(structure.end)} ${getTerrainYCoord(nowHeight)}`,
      );

      result.push(
        <path
          d={points.join(" ")}
          stroke="black"
          fill="transparent"
          strokeWidth={1}
        ></path>,
      );

      if (structure.type === "tunnel") {
        const railZ = getEveration(
          (structure.start + structure.end) / 2,
        ).everation;
        const terrainZ =
          selectedRoute.terrains.find(
            (v) =>
              v.distance ===
              roundUpMultiple((structure.start + structure.end) / 2, 10),
          )?.z || 0;
        result.push(
          <path
            d={`M ${getTerrainXCoord((structure.start + structure.end) / 2)} ${getTerrainYCoord(railZ + 5)} V ${getTerrainYCoord(terrainZ + 15)}`}
            stroke="black"
            fill="transparent"
            strokeWidth={0.5}
          ></path>,
        );
        result.push(
          getHataage(
            getTerrainXCoord((structure.start + structure.end) / 2),
            getTerrainYCoord(terrainZ + 15),
            structure.name,
            `L=${getDistanceStrShort(structure.end - structure.start)}`,
          ),
        );
      } else if (structure.type === "bridge") {
        const elevation = getEveration(
          (structure.start + structure.end) / 2,
        ).everation;
        result.push(
          <path
            d={`M ${getTerrainXCoord((structure.start + structure.end) / 2)} ${getTerrainYCoord(elevation)} V ${getTerrainYCoord(elevation + 25)}`}
            stroke="black"
            fill="transparent"
            strokeWidth={0.5}
          ></path>,
        );
        result.push(
          getHataage(
            getTerrainXCoord((structure.start + structure.end) / 2),
            getTerrainYCoord(elevation + 25),
            structure.name,
            `L=${getDistanceStrShort(structure.end - structure.start)}`,
          ),
        );
      }
    }
    return result;
  }, [
    endDistance,
    higherZ,
    lowerZ,
    selectedRoute.gradients,
    selectedRoute.structures,
    selectedRoute.terrains,
    startDistance,
    startZ,
  ]);

  /// 踏切関係
  const crossingElements = useMemo(() => {
    const getTerrainXCoord = (distance: number) =>
      (distance - startDistance) / xScale;
    const getTerrainYCoord = (distance: number) =>
      (higherZ - distance - lowerZ) / yScale;
    function getEveration(distance: number): {
      everation: number;
      gradient: number;
    } {
      if (distance >= endDistance) {
        return { everation: 0, gradient: 0 };
      }

      let everation = startZ;
      let gradient = 0;
      for (let i = 0; i < distance; i++) {
        everation += gradient / 1000;

        const gradientChange = selectedRoute.gradients.find(
          (v) => v.position === i,
        );
        if (gradientChange) {
          gradient = gradientChange.value;
        }
      }

      return { everation, gradient };
    }

    const result = [];
    for (const crossing of selectedRoute.crossings) {
      const elevation = getEveration(crossing.distance).everation;
      result.push(
        <path
          d={`M ${getTerrainXCoord(crossing.distance)} ${getTerrainYCoord(elevation)} V ${getTerrainYCoord(elevation + 25)}`}
          stroke="black"
          fill="transparent"
          strokeWidth={0.5}
        ></path>,
      );
      result.push(
        getHataage(
          getTerrainXCoord(crossing.distance),
          getTerrainYCoord(elevation + 25),
          `${crossing.name}踏切`,
          `${getDistanceStrShort(crossing.distance)}`,
        ),
      );
    }
    return result;
  }, [
    endDistance,
    higherZ,
    lowerZ,
    selectedRoute.crossings,
    selectedRoute.gradients,
    startDistance,
    startZ,
  ]);

  const culvertElements = useMemo(() => {
    const getTerrainXCoord = (distance: number) =>
      (distance - startDistance) / xScale;
    const getTerrainYCoord = (distance: number) =>
      (higherZ - distance - lowerZ) / yScale;
    function getEveration(distance: number): {
      everation: number;
      gradient: number;
    } {
      if (distance >= endDistance) {
        return { everation: 0, gradient: 0 };
      }

      let everation = startZ;
      let gradient = 0;
      for (let i = 0; i < distance; i++) {
        everation += gradient / 1000;

        const gradientChange = selectedRoute.gradients.find(
          (v) => v.position === i,
        );
        if (gradientChange) {
          gradient = gradientChange.value;
        }
      }

      return { everation, gradient };
    }

    if (selectedRoute.terrains.length === 0) {
      return <></>;
    }

    const result = [];
    for (const culvert of selectedRoute.culverts) {
      const elevation = getEveration(culvert.distance).everation;
      const terrainElevation =
        selectedRoute.terrains.find((v) => v.distance === culvert.distance)
          ?.z || 0;
      result.push(
        <path
          d={`M ${getTerrainXCoord(culvert.distance - 5)} ${getTerrainYCoord(terrainElevation)} V ${getTerrainYCoord(terrainElevation + 5)} H ${getTerrainXCoord(culvert.distance + 5)} V ${getTerrainYCoord(terrainElevation)}`}
          stroke="black"
          fill="transparent"
          strokeWidth={0.5}
        ></path>,
      );
      result.push(
        <path
          d={`M ${getTerrainXCoord(culvert.distance)} ${getTerrainYCoord(elevation)} V ${getTerrainYCoord(elevation + 25)}`}
          stroke="black"
          fill="transparent"
          strokeWidth={0.5}
        ></path>,
      );
      result.push(
        getHataage(
          getTerrainXCoord(culvert.distance),
          getTerrainYCoord(elevation + 25),
          `${culvert.name}渠橋`,
          `${getDistanceStrShort(culvert.distance)}`,
        ),
      );
    }
    return result;
  }, [
    endDistance,
    higherZ,
    lowerZ,
    selectedRoute.culverts,
    selectedRoute.gradients,
    selectedRoute.terrains,
    startDistance,
    startZ,
  ]);

  const axisWidth = 50;
  const gradientHeight = 15;

  const getTerrainXCoord = (distance: number) =>
    (distance - startDistance) / xScale;
  const getTerrainYCoord = (distance: number) =>
    (higherZ - distance - lowerZ) / yScale;

  const gradientValues = [];
  {
    // 勾配線
    const g = [
      {
        position: startDistance,
        value: 0,
      } satisfies Gradient,
      ...selectedRoute.gradients,
      {
        position: endDistance,
        value: 0,
      } satisfies Gradient,
    ];
    for (let i = 1; i < g.length; i++) {
      const current = g[i - 1];
      const next = g[i];
      if (current.value < 0) {
        // 下り勾配
        const centerX = (current.position + next.position) / 2;
        gradientValues.push(
          <path
            d={[
              `M ${getTerrainXCoord(current.position)} ${gradientHeight / 2}`,
              `L ${getTerrainXCoord(centerX) - 10} ${gradientHeight / 2}`,
              `L ${getTerrainXCoord(centerX) - 10} ${gradientHeight / 2 - 2.5}`,
              `L ${getTerrainXCoord(centerX) + 10} ${gradientHeight / 2 + 2.5}`,
              `L ${getTerrainXCoord(centerX) + 10} ${gradientHeight / 2}`,
              `L ${getTerrainXCoord(next.position)} ${gradientHeight / 2}`,
            ].join(" ")}
            stroke="black"
            fill="transparent"
            strokeWidth={0.5}
          />,
        );
        gradientValues.push(
          <text
            x={getTerrainXCoord((current.position + next.position) / 2)}
            textAnchor="middle"
            dominantBaseline="middle"
            y={gradientHeight / 2 - 2.5}
            fontSize={4}
            fontFamily="monospace"
            transform={`rotate(12.5, ${getTerrainXCoord((current.position + next.position) / 2)}, ${gradientHeight / 2 - 2.5})`}
          >
            {Math.abs(current.value).toFixed(2)}‰
          </text>,
        );
        gradientValues.push(
          <text
            x={getTerrainXCoord((current.position + next.position) / 2)}
            textAnchor="middle"
            dominantBaseline="middle"
            y={gradientHeight / 2 + 2.5}
            fontSize={3}
            fontFamily="monospace"
            transform={`rotate(12.5, ${getTerrainXCoord((current.position + next.position) / 2)}, ${gradientHeight / 2 - 2.5})`}
          >
            {getDistanceStrShort(next.position - current.position)}
          </text>,
        );
      } else if (current.value > 0) {
        // 上り勾配
        const centerX = (current.position + next.position) / 2;
        gradientValues.push(
          <path
            d={[
              `M ${getTerrainXCoord(current.position)} ${gradientHeight / 2}`,
              `L ${getTerrainXCoord(centerX) - 10} ${gradientHeight / 2}`,
              `L ${getTerrainXCoord(centerX) - 10} ${gradientHeight / 2 + 2.5}`,
              `L ${getTerrainXCoord(centerX) + 10} ${gradientHeight / 2 - 2.5}`,
              `L ${getTerrainXCoord(centerX) + 10} ${gradientHeight / 2}`,
              `L ${getTerrainXCoord(next.position)} ${gradientHeight / 2}`,
            ].join(" ")}
            stroke="black"
            fill="transparent"
            strokeWidth={0.5}
          />,
        );
        gradientValues.push(
          <text
            x={getTerrainXCoord((current.position + next.position) / 2)}
            textAnchor="middle"
            dominantBaseline="middle"
            y={gradientHeight / 2 - 2.5}
            fontSize={4}
            fontFamily="monospace"
            transform={`rotate(-12.5, ${getTerrainXCoord((current.position + next.position) / 2)}, ${gradientHeight / 2 - 2.5})`}
          >
            {Math.abs(current.value).toFixed(2)}‰
          </text>,
        );
        gradientValues.push(
          <text
            x={getTerrainXCoord((current.position + next.position) / 2)}
            textAnchor="middle"
            dominantBaseline="middle"
            y={gradientHeight / 2 + 2.5}
            fontSize={3}
            fontFamily="monospace"
            transform={`rotate(-12.5, ${getTerrainXCoord((current.position + next.position) / 2)}, ${gradientHeight / 2 - 2.5})`}
          >
            {getDistanceStrShort(next.position - current.position)}
          </text>,
        );
      } else {
        // 平坦
        gradientValues.push(
          <path
            d={`M ${getTerrainXCoord(current.position)} ${gradientHeight / 2} L ${getTerrainXCoord(next.position)} ${gradientHeight / 2}`}
            stroke="black"
            fill="transparent"
            strokeWidth={0.5}
          />,
        );
        gradientValues.push(
          <text
            x={getTerrainXCoord((current.position + next.position) / 2)}
            textAnchor="middle"
            dominantBaseline="middle"
            y={gradientHeight / 2 - 2.5}
            fontSize={4}
            fontFamily="monospace"
          >
            LEVEL
          </text>,
        );
        gradientValues.push(
          <text
            x={getTerrainXCoord((current.position + next.position) / 2)}
            textAnchor="middle"
            dominantBaseline="middle"
            y={gradientHeight / 2 + 2.5}
            fontSize={3}
            fontFamily="monospace"
          >
            {getDistanceStrShort(next.position - current.position)}
          </text>,
        );
      }
    }
  }
  {
    function getRailZ(index: number) {
      let currentZ = startZ;
      const g = [
        {
          position: startDistance,
          value: 0,
        } satisfies Gradient,
        ...selectedRoute.gradients,
        {
          position: endDistance,
          value: 0,
        } satisfies Gradient,
      ];
      for (let i = 1; i < index + 2; i++) {
        const before = g[i - 1];
        const current = g[i];

        const length = current.position - before.position;
        const diffZ = (before.value * length) / 1000;
        currentZ += diffZ;
      }
      return currentZ;
    }

    // 勾配丸
    for (let i = 0; i < selectedRoute.gradients.length; i++) {
      const current = selectedRoute.gradients[i];
      gradientValues.push(
        <circle
          cx={getTerrainXCoord(current.position)}
          cy={gradientHeight / 2}
          r={6}
          stroke="black"
          fill="white"
          strokeWidth={0.5}
        />,
      );
      gradientValues.push(
        <text
          x={getTerrainXCoord(current.position)}
          textAnchor="middle"
          dominantBaseline="middle"
          y={gradientHeight / 2}
          fontSize={3}
          fontFamily="monospace"
        >
          {getRailZ(i).toFixed(3)}
        </text>,
      );
    }
  }

  const terrainHeightsHeight = 15;
  const terrainHeights = [];
  for (let i = startDistance + 20; i < endDistance; i += 20) {
    terrainHeights.push(
      <text
        x={getTerrainXCoord(i)}
        y={terrainHeightsHeight / 2}
        fontSize={3}
        fontFamily="monospace"
        textAnchor="middle"
        dominantBaseline="middle"
        transform={`rotate(90, ${getTerrainXCoord(i)}, ${terrainHeightsHeight / 2})`}
      >
        {getDistanceStrShort(i)}
      </text>,
    );
  }

  const curvesHeight = 15;
  const curveValues = [];
  {
    const coords = [];
    coords.push(`M 0 ${curvesHeight / 2}`);
    for (const curve of curves) {
      if (curve.direction === "left") {
        coords.push(`L ${getTerrainXCoord(curve.start)} ${curvesHeight / 2}`);
        coords.push(
          `L ${getTerrainXCoord(curve.start)} ${curvesHeight / 2 + 2.5}`,
        );
        coords.push(
          `L ${getTerrainXCoord(curve.end)} ${curvesHeight / 2 + 2.5}`,
        );
        coords.push(`L ${getTerrainXCoord(curve.end)} ${curvesHeight / 2}`);

        curveValues.push(
          <text
            x={getTerrainXCoord(curve.start)}
            y={terrainHeightsHeight / 2 + 5}
            fontSize={3}
            fontFamily="monospace"
            textAnchor="middle"
            dominantBaseline="middle"
          >
            {getDistanceStrShort(curve.start)}
          </text>,
        );
        curveValues.push(
          <text
            x={getTerrainXCoord(curve.end)}
            y={terrainHeightsHeight / 2 + 5}
            fontSize={3}
            fontFamily="monospace"
            textAnchor="middle"
            dominantBaseline="middle"
          >
            {getDistanceStrShort(curve.end)}
          </text>,
        );
        curveValues.push(
          <text
            x={getTerrainXCoord((curve.start + curve.end) / 2)}
            y={terrainHeightsHeight / 2}
            fontSize={3}
            fontFamily="monospace"
            textAnchor="middle"
            dominantBaseline="middle"
          >
            R={curve.radius}
          </text>,
        );
      } else {
        coords.push(`L ${getTerrainXCoord(curve.start)} ${curvesHeight / 2}`);
        coords.push(
          `L ${getTerrainXCoord(curve.start)} ${curvesHeight / 2 - 2.5}`,
        );
        coords.push(
          `L ${getTerrainXCoord(curve.end)} ${curvesHeight / 2 - 2.5}`,
        );
        coords.push(`L ${getTerrainXCoord(curve.end)} ${curvesHeight / 2}`);

        curveValues.push(
          <text
            x={getTerrainXCoord(curve.start)}
            y={terrainHeightsHeight / 2 - 5}
            fontSize={3}
            fontFamily="monospace"
            textAnchor="middle"
            dominantBaseline="middle"
          >
            {getDistanceStrShort(curve.start)}
          </text>,
        );
        curveValues.push(
          <text
            x={getTerrainXCoord(curve.end)}
            y={terrainHeightsHeight / 2 - 5}
            fontSize={3}
            fontFamily="monospace"
            textAnchor="middle"
            dominantBaseline="middle"
          >
            {getDistanceStrShort(curve.end)}
          </text>,
        );
        curveValues.push(
          <text
            x={getTerrainXCoord((curve.start + curve.end) / 2)}
            y={terrainHeightsHeight / 2}
            fontSize={3}
            fontFamily="monospace"
            textAnchor="middle"
            dominantBaseline="middle"
          >
            R={curve.radius}
          </text>,
        );
      }
    }
    coords.push(`L ${getTerrainXCoord(endDistance)} ${curvesHeight / 2}`);
    curveValues.push(
      <path
        d={coords.join(" ")}
        stroke="black"
        fill="transparent"
        strokeWidth={0.5}
      ></path>,
    );
  }

  return (
    <>
      <div>
        {/* <button onClick={handleDownload}>SVGをダウンロード</button> */}
      </div>
      <div style={{ height: "100%", width: "100%" }}>
        <svg
          id="output"
          ref={svgRef}
          viewBox={`0 0 ${getTerrainXCoord(endDistance) + marginEdge * 3} ${getTerrainYCoord(lowerZ) + gradientHeight + marginEdge * 2}`}
          width={`${(getTerrainXCoord(endDistance) + marginEdge * 3) * 2}px`}
          height={`${(getTerrainYCoord(lowerZ) + gradientHeight + marginEdge * 2) * 2}px`}
          onMouseDown={(e) => {
            const rawX = e.clientX;
            const rect = svgRef.current?.getBoundingClientRect();
            const calcX =
              ((rawX - (rect?.left || 0) - marginEdge - axisWidth - 100) *
                xScale) /
              2;
            const x = Math.min(
              selectedRoute.terrains[selectedRoute.terrains.length - 1]
                .distance,
              Math.max(0, calcX),
            );
            setPointerDistance(x);
          }}
        >
          <g
            id="terrain"
            transform={`translate(${marginEdge + axisWidth} ${marginEdge})`}
          >
            {terrainElements}
          </g>
          <g
            id="rail-value"
            transform={`translate(${marginEdge + axisWidth} ${marginEdge})`}
          >
            {railElement}
          </g>
          <g
            id="stations"
            transform={`translate(${marginEdge + axisWidth} ${marginEdge})`}
          >
            {stationElements}
          </g>
          <g
            id="structures"
            transform={`translate(${marginEdge + axisWidth} ${marginEdge})`}
          >
            {structuresElements}
          </g>
          <g
            id="crossings"
            transform={`translate(${marginEdge + axisWidth} ${marginEdge})`}
          >
            {crossingElements}
          </g>
          <g
            id="culverts"
            transform={`translate(${marginEdge + axisWidth} ${marginEdge})`}
          >
            {culvertElements}
          </g>
          <g
            id="terrain-axis"
            transform={`translate(${marginEdge} ${marginEdge})`}
          >
            <path
              d={`M 0 0 V ${getTerrainYCoord(lowerZ)} H ${axisWidth} V 0 Z`}
              stroke="black"
              fill="white"
              strokeWidth={0.5}
            ></path>
            <path
              d={`M ${axisWidth} 0 H ${getTerrainXCoord(endDistance) + axisWidth} V ${getTerrainYCoord(lowerZ)} H ${axisWidth}`}
              stroke="black"
              fill="transparent"
              strokeWidth={0.5}
            ></path>
            <text
              x={axisWidth / 2}
              y={getTerrainYCoord((higherZ + lowerZ) / 2)}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize={6}
              fill="black"
              fontFamily="monospace"
            >
              縦断面図
            </text>
          </g>
          <g
            id="gradient-axis"
            transform={`translate(${marginEdge} ${marginEdge + getTerrainYCoord(lowerZ)})`}
          >
            <path
              d={`M 0 0 V ${gradientHeight} H ${axisWidth} V 0 Z`}
              stroke="black"
              fill="transparent"
              strokeWidth={0.5}
            ></path>
            <path
              d={`M ${axisWidth} 0 H ${getTerrainXCoord(endDistance) + axisWidth} V ${gradientHeight} H ${axisWidth}`}
              stroke="black"
              fill="transparent"
              strokeWidth={0.5}
            ></path>
            <text
              x={axisWidth / 2}
              y={gradientHeight / 2}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize={6}
              fill="black"
              fontFamily="monospace"
            >
              勾 配
            </text>
          </g>
          <g
            id="gradient-value"
            transform={`translate(${marginEdge + axisWidth} ${marginEdge + getTerrainYCoord(lowerZ)})`}
          >
            {gradientValues}
          </g>
          <g
            id="terrain-height-axis"
            transform={`translate(${marginEdge} ${marginEdge + getTerrainYCoord(lowerZ) + gradientHeight})`}
          >
            <path
              d={`M 0 0 V ${terrainHeightsHeight} H ${axisWidth} V 0 Z`}
              stroke="black"
              fill="transparent"
              strokeWidth={0.5}
            ></path>
            <path
              d={`M ${axisWidth} 0 H ${getTerrainXCoord(endDistance) + axisWidth} V ${terrainHeightsHeight} H ${axisWidth}`}
              stroke="black"
              fill="transparent"
              strokeWidth={0.5}
            ></path>
            <text
              x={axisWidth / 2}
              y={terrainHeightsHeight / 2}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize={6}
              fill="black"
              fontFamily="monospace"
            >
              距離程
            </text>
          </g>
          <g
            id="terrain-height"
            transform={`translate(${marginEdge + axisWidth} ${marginEdge + getTerrainYCoord(lowerZ) + gradientHeight})`}
          >
            {terrainHeights}
          </g>
          <g
            id="curves-axis"
            transform={`translate(${marginEdge} ${marginEdge + getTerrainYCoord(lowerZ) + gradientHeight + terrainHeightsHeight})`}
          >
            <path
              d={`M 0 0 V ${curvesHeight} H ${axisWidth} V 0 Z`}
              stroke="black"
              fill="transparent"
              strokeWidth={0.5}
            ></path>
            <path
              d={`M ${axisWidth} 0 H ${getTerrainXCoord(endDistance) + axisWidth} V ${curvesHeight} H ${axisWidth}`}
              stroke="black"
              fill="transparent"
              strokeWidth={0.5}
            ></path>
            <text
              x={axisWidth / 2}
              y={curvesHeight / 2}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize={6}
              fill="black"
              fontFamily="monospace"
            >
              直曲線
            </text>
          </g>
          <g
            id="curves-values"
            transform={`translate(${marginEdge + axisWidth} ${marginEdge + getTerrainYCoord(lowerZ) + gradientHeight + terrainHeightsHeight})`}
          >
            {curveValues}
          </g>
          <g transform={`translate(${marginEdge + axisWidth} ${marginEdge})`}>
            <line
              x1={pointerDistance / xScale}
              x2={pointerDistance / xScale}
              y1={0}
              y2={
                getTerrainYCoord(lowerZ) +
                gradientHeight +
                terrainHeightsHeight +
                curvesHeight
              }
              stroke="red"
            />
          </g>
        </svg>
      </div>
    </>
  );
}
