import axios from 'axios';
import { DEFAULT_GET_LIST_PARAMS } from '../constants';
import { GetListParams, ListResponse, RuleChain, RuleChainMetadata } from '../types';

export const getRuleChains = (params: GetListParams = DEFAULT_GET_LIST_PARAMS) =>
  axios.get<ListResponse<RuleChain>>('/ruleChains', { params: { page: 0, ...params } });

export const getRuleChainMetadata = (id: string) =>
  axios.get<RuleChainMetadata>(`/ruleChain/${id}/metadata`);
