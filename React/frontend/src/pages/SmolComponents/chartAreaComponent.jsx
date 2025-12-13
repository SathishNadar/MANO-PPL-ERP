import React, { useEffect, useRef } from "react";
import Chart from "chart.js/auto";

const API_BASE = import.meta.env.VITE_API_BASE ?? "/api";
const DEFAULT_AVATAR = "https://www.gravatar.com/avatar/?d=mp&s=80";

const chartAreaComponent = ({ projects = [], filterProjects, query, getDaysInfo }) => {
  const chartRef = useRef(null);
  const chartInstanceRef = useRef(null);

  useEffect(() => {
    if (!projects || !filterProjects) return;

    const visible = filterProjects(projects, query);
    const labels = visible.map((p) => p.project_name);
    const elapsedValues = visible.map((p) => getDaysInfo(p).elapsed);
    const totalValues = visible.map((p) => getDaysInfo(p).total);

    const barColors = visible.map((p) =>
      getDaysInfo(p).completed
        ? "rgba(34,197,94,0.85)"
        : "rgba(59,130,246,0.8)"
    );

    const maxVal = Math.max(10, ...elapsedValues);

    // dynamic axis max: start at 365 and grow in steps of 50 when needed
    const axisStep = 50;
    const axisBase = 365;
    let axisMax = axisBase;
    while (maxVal > axisMax) axisMax += axisStep;

    // destroy old chart cleanly
    try {
      const existing =
        chartInstanceRef.current ||
        (chartRef.current && Chart.getChart(chartRef.current));
      if (existing) existing.destroy();
    } catch (e) {}

    if (!chartRef.current) return;

    // plugin: draw values (e.g. "12d") beside bars
    const valueLabels = {
      id: "valueLabels",
      afterDatasetsDraw: (chart) => {
        const ctx = chart.ctx;
        chart.data.datasets.forEach((dataset, i) => {
          const meta = chart.getDatasetMeta(i);
          meta.data.forEach((bar, idx) => {
            const value = dataset.data[idx];
            const x = bar.x + 8;
            const y = bar.y;
            ctx.save();
            ctx.fillStyle = "#D1D5DB";
            ctx.font = "12px Poppins, sans-serif";
            ctx.textAlign = "left";
            ctx.textBaseline = "middle";
            ctx.fillText(`${value}days`, x, y);
            ctx.restore();
          });
        });
      },
    };

    chartInstanceRef.current = new Chart(chartRef.current, {
      type: "bar",
      data: {
        labels,
        datasets: [
          {
            label: "Elapsed Days",
            data: elapsedValues,
            backgroundColor: barColors,
            borderColor: "rgba(59,130,246,1)",
            borderWidth: 1,
            borderRadius: 6,
            borderSkipped: false,
          },
        ],
      },
      options: {
        indexAxis: "y",
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (ctx) => `${ctx.dataset.label}: ${ctx.raw}days`,
            },
          },
        },
        scales: {
          y: {
            grid: { display: false },
            ticks: { color: "#9CA3AF" },
          },
          x: {
            beginAtZero: true,
            max: axisMax,
            ticks: {
              color: "#9CA3AF",
              stepSize: 50,
            },
            grid: {
              color: "rgba(255,255,255,0.04)",
            },
          },
        },
      },
      plugins: [valueLabels],
    });

    return () => {
      try {
        chartInstanceRef.current?.destroy();
        chartInstanceRef.current = null;
      } catch (e) {}
    };
  }, [projects, query]);

  return (
    <canvas id="projectChart" ref={chartRef} style={{ width: "100%", height: "100%" }} />
  );
};

export default chartAreaComponent;