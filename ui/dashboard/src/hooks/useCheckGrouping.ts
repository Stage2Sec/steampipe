import get from "lodash/get";
import KeyValuePairNode from "../components/dashboards/check/common/KeyValuePairNode";
import RootNode from "../components/dashboards/check/common/RootNode";
import {
  CheckDisplayGroup,
  CheckNode,
  CheckProps,
  CheckResult,
} from "../components/dashboards/check/common";
import { default as BenchmarkType } from "../components/dashboards/check/common/Benchmark";
import { useMemo } from "react";
import ControlNode from "../components/dashboards/check/common/ControlNode";
import ControlResultNode from "../components/dashboards/check/common/ControlResultNode";

const getCheckGroupingKey = (check: CheckResult, group: CheckDisplayGroup) => {
  switch (group.type) {
    case "dimension":
      const foundDimension = check.dimensions.find(
        (d) => d.key === group.value
      );
      return foundDimension ? foundDimension.value : "Other";
    case "tag":
      return group.value ? check.tags[group.value] || "Other" : "Other";
    case "control":
      return check.control.name;
    default:
      return "Other";
  }
};

const getCheckGroupingNode = (
  check: CheckResult,
  group: CheckDisplayGroup,
  depth: number,
  children: CheckNode[]
) => {
  switch (group.type) {
    case "dimension":
      const foundDimension = check.dimensions.find(
        (d) => d.key === group.value
      );
      const dimensionValue = foundDimension ? foundDimension.value : "None";
      return new KeyValuePairNode(
        depth,
        group.value || "Other",
        dimensionValue,
        children
      );
    case "tag":
      return new KeyValuePairNode(
        depth,
        group.value || "None",
        group.value ? check.tags[group.value] || "None" : "None",
        children
      );
    case "control":
      return new ControlNode(
        depth,
        check.control.name,
        check.control.title,
        children
      );
    default:
      throw new Error(`Unknown group type ${group.type}`);
  }
};

const useCheckGrouping = (props: CheckProps) => {
  const rootBenchmark = get(props, "execution_tree.root.groups[0]", null);

  const groupingsConfig = useMemo(
    () =>
      props.properties?.grouping ||
      ([
        // { type: "benchmark" },
        // { type: "control" },
        // { type: "result" },
        // { type: "dimension", value: "account_id" },
        { type: "dimension", value: "region" },
        { type: "tag", value: "service" },
        // { type: "tag", value: "cis_type" },
        { type: "control" },
      ] as CheckDisplayGroup[]),
    [props.properties]
  );

  return useMemo(() => {
    if (!rootBenchmark) {
      return null;
    }

    const b = new BenchmarkType(
      0,
      rootBenchmark.group_id,
      rootBenchmark.title,
      rootBenchmark.description,
      rootBenchmark.groups,
      rootBenchmark.controls
    );

    const result: CheckNode[] = [];
    const temp = { _: result };
    b.all_control_results.forEach(function (checkResult) {
      // reduced._ = [reduced._, ...checkResult];
      return groupingsConfig
        .reduce(function (grouping, currentGroup, currentIndex) {
          // const groupingNode = getCheckGroupingNode(a, current);
          // const foundDimension = a.dimensions.find(
          //   (d) => d.key === current.value
          // );
          // const dimension = foundDimension ? foundDimension.value : "None";
          const groupKey = getCheckGroupingKey(checkResult, currentGroup);
          // console.log({ groupKey, grouping });
          // console.log({ key: groupKey, grouping, result });
          if (!grouping[groupKey]) {
            grouping[groupKey] = { _: [] };
            const groupingNode = getCheckGroupingNode(
              checkResult,
              currentGroup,
              currentIndex + 1,
              grouping[groupKey]._
            );

            // if (currentIndex === groupingsConfig.length - 1) {
            //   // console.log("Pushing to new group", {
            //   //   key: groupKey,
            //   //   groupingNode,
            //   //   checkResult,
            //   // });
            //   groupingNode.results.push(checkResult);
            // }

            if (groupingNode) {
              grouping._.push(groupingNode);
            }
            // grouping._.push({
            //   [current.value || current.type]: dimension,
            //   ["children"]: grouping[dimension]._,
            // });
          }
          // else {
          //   console.log({ groupKey, grouping, result, temp });
          // }
          // else if (currentIndex === groupingsConfig.length - 1) {
          // console.log({ groupKey, grouping, result, temp });
          // grouping._[0].results?.push(checkResult);
          // }
          //   // console.log("Pushing to existing group", {
          //   //   key: groupKey,
          //   //   group: grouping[groupKey],
          //   //   checkResult,
          //   // });
          //   grouping[groupKey].results?.push(checkResult);
          // }
          // else {
          //   console.log(
          //     "Grouping exists",
          //     currentIndex,
          //     groupKey,
          //     grouping[groupKey]
          //   );
          // }

          return grouping[groupKey];
        }, temp)
        ._.push(new ControlResultNode(groupingsConfig.length + 1, checkResult));
      // ._.push(
      //   getCheckGroupingNode(
      //     checkResult,
      //     { type: "control" },
      //     groupingsConfig.length,
      //     []
      //   )
      // );
    });

    // console.log(result);

    // console.log(result);

    return new RootNode(result);

    // return b;
  }, [groupingsConfig, rootBenchmark]);
};

export default useCheckGrouping;

// keys = ['level1', 'level2'],
//     result = [],
//     temp = { _: result };
//
// data.forEach(function (a) {
//   keys.reduce(function (r, k) {
//     if (!r[a[k]]) {
//       r[a[k]] = { _: [] };
//       r._.push({ [k]: a[k], [k + 'list']: r[a[k]]._ });
//     }
//     return r[a[k]];
//   }, temp)._.push({ Id: a.Id });
// });
//
// console.log(result);
