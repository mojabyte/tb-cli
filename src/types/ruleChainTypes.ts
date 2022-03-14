export interface RuleChain {
  id: {
    entityType: 'RULE_CHAIN';
    id: string;
  };
  createdTime: number;
  additionalInfo: {
    description: string;
  };
  tenantId: {
    entityType: 'TENANT';
    id: string;
  };
  name: string;
  firstRuleNodeId: {
    entityType: 'RULE_NODE';
    id: string;
  };
  root: boolean;
  debugMode: boolean;
  configuration: any;
}

export interface Node {
  id: {
    entityType: 'RULE_NODE';
    id: string;
  };
  createdTime: number;
  additionalInfo: {
    description: string;
    layoutX: number;
    layoutY: number;
  };
  ruleChainId: {
    entityType: 'RULE_CHAIN';
    id: string;
  };
  type: 'org.thingsboard.rule.engine.telemetry.TbMsgTimeseriesNode'; // TODO: fix this
  name: string;
  debugMode: boolean;
  configuration: {
    defaultTTL: number;
  };
}

export interface RuleChainConnection {
  fromIndex: number;
  targetRuleChainId: {
    entityType: 'RULE_CHAIN';
    id: string;
  };
  additionalInfo: {
    description: string;
    layoutX: number;
    layoutY: number;
    ruleChainNodeId: string;
  };
  type: string;
}

export interface Connection {
  fromIndex: number;
  toIndex: number;
  type: string;
}

export interface RuleChainMetadata {
  ruleChainId: {
    entityType: 'RULE_CHAIN';
    id: string;
  };
  firstNodeIndex: number;
  nodes: Node[];
  connections: Connection[];
  ruleChainConnections: RuleChainConnection[];
}
