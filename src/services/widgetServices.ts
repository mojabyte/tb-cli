import axios from 'axios';
import { DEFAULT_GET_LIST_PARAMS } from '../constants';
import { GetListParams, ListResponse, WidgetsBundle, WidgetsBundleData } from '../types';

export const getWidgetsBundles = (params: GetListParams = DEFAULT_GET_LIST_PARAMS) =>
  axios.get<ListResponse<WidgetsBundle>>('/widgetsBundles', { params: { page: 0, ...params } });

export const getWidgetsBundlesData = (alias: string, isSystem: boolean = false) =>
  axios.get<WidgetsBundleData>(`widgetTypes?isSystem=${isSystem}&bundleAlias=${alias}`);

export const saveWidgetsBundle = (widgetsBundle: any) => axios.post('widgetsBundle', widgetsBundle);

export const saveWidgetType = (widgetType: any) => axios.post('widgetType', widgetType);
