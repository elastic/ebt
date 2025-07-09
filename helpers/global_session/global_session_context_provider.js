"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerGlobalSessionContextProvider = registerGlobalSessionContextProvider;
var rxjs_1 = require("rxjs");
function registerGlobalSessionContextProvider(_a) {
    var analyticsClient = _a.analyticsClient, userId$ = _a.userId$;
    analyticsClient.registerContextProvider({
        name: 'global_session',
        schema: {
            global_session: {
                type: 'keyword',
                _meta: {
                    description: 'Global session ID',
                },
            },
        },
        context$: userId$.pipe((0, rxjs_1.map)(function (userId) { return ({ global_session: userId }); })),
    });
}
