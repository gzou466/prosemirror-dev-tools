import React from "react";
import styled from "react-emotion";
import { Tab, Tabs, TabList, TabPanel } from "./components/tabs";
import { Subscribe } from "unstated";
import GlobalStateContainer from "./state/global";
import StateTab from "./tabs/state";
import HistoryTab from "./tabs/history";
import SchemaTab from "./tabs/schema";
import PluginsTab from "./tabs/plugins";
import StructureTab from "./tabs/structure";
import CSSReset from "./components/css-reset";
import theme from "./theme";

const TabsContainer = styled("div")({
  width: "100%",
  height: "100%",
  overflow: "hidden",
  background: theme.mainBg,
  fontFamily: "Helvetica Neue, Calibri Light, Roboto, sans-serif",
  fontSize: "13px"
});
TabsContainer.displayName = "TabsContainer";

export default function DevToolsExpanded() {
  return (
    <Subscribe to={[GlobalStateContainer]}>
      {globalState => {
        const {
          state: { tabIndex },
          selectTab
        } = globalState;

        return (
          <CSSReset>
            <TabsContainer>
              <Tabs onSelect={selectTab} selectedIndex={tabIndex}>
                <TabList>
                  <Tab index="state">State</Tab>
                  {/* <Tab index="history">History</Tab>
                  <Tab index="plugins">Plugins</Tab> */}
                  <Tab index="schema">Schema</Tab>
                  <Tab index="structure">Structure</Tab>
                </TabList>

                <TabPanel>
                  {({ index }) => {
                    switch (index) {
                      case "state":
                        return <StateTab />;
                      // case "history":
                      //   return <HistoryTab />;
                      // case "plugins":
                      //   return <PluginsTab />;
                      case "schema":
                        return <SchemaTab />;
                      case "structure":
                        return <StructureTab />;
                      default:
                        return <StateTab />;
                    }
                  }}
                </TabPanel>
              </Tabs>
            </TabsContainer>
          </CSSReset>
        );
      }}
    </Subscribe>
  );
}
