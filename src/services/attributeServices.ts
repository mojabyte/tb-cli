import axios from 'axios';
import { AttributesScope } from '../types';

export const getDeviceAttributesByScope = (
  id: string,
  scope: AttributesScope,
  keys: string[] = []
) => axios.get(`/plugins/telemetry/DEVICE/${id}/values/attributes/${scope}?keys=${keys.join(',')}`);

export const getDeviceAttributes = (id: string, keys: string[] = []) =>
  axios.get(`/plugins/telemetry/DEVICE/${id}/values/attributes?keys=${keys.join(',')}`);

export const saveDeviceAttributes = (id: string, scope: AttributesScope, attributes: any) =>
  axios.post(`/plugins/telemetry/${id}/${scope}`, attributes);
