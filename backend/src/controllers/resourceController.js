import * as resourceService from "../services/resourceService.js";
import { handleRequest } from "../utils/handleRequest.js";

export const meta = handleRequest(() => resourceService.meta());
export const list = handleRequest((req) => resourceService.list(req.params.resource, req.user, req.query));
export const get = handleRequest((req) => resourceService.get(req.params.resource, req.params.id, req.user));
export const create = handleRequest((req) => resourceService.create(req.params.resource, req.user, req.body));
export const update = handleRequest((req) => resourceService.update(req.params.resource, req.params.id, req.user, req.body));
export const updateStatus = handleRequest((req) => resourceService.updateStatus(req.params.resource, req.params.id, req.user, req.body));
export const remove = handleRequest((req) => resourceService.remove(req.params.resource, req.params.id, req.user));
