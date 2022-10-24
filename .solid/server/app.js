import { createComponent, renderToStringAsync, isServer, mergeProps, ssr, ssrHydrationKey, ssrSpread, escape, Assets, HydrationScript, NoHydration, Portal, ssrBoolean } from 'solid-js/web';
import { createContext, createSignal, onMount, onCleanup, runWithOwner, createMemo, getOwner, useContext, createComponent as createComponent$1, useTransition, on, untrack, resetErrorBoundaries, createRenderEffect, createRoot, Show, splitProps, lazy, createEffect, sharedConfig, mergeProps as mergeProps$1, createResource, For, createUniqueId } from 'solid-js';
import { customAlphabet } from 'nanoid';
import { generateSlug } from 'random-word-slugs';
import { createEventListenerMap } from '@solid-primitives/event-listener';
import createDebounce, { createDebounce as createDebounce$1 } from '@solid-primitives/debounce';
import { EditorSelection } from '@codemirror/state';
import { Transition } from 'solid-transition-group';
import { EditorView, EditorState, basicSetup } from '@codemirror/basic-setup';
import { indentWithTab } from '@codemirror/commands';
import { javascript } from '@codemirror/lang-javascript';
import { keymap } from '@codemirror/view';
import invariant$2 from 'tiny-invariant';
import { yCollab } from 'y-codemirror.next';
import { createGenerator } from '@unocss/core';
import { presetUno } from '@unocss/preset-uno';
import { transform } from 'sucrase';
import { IndexeddbPersistence } from 'y-indexeddb';
import { WebsocketProvider } from 'y-websocket';
import * as Y from 'yjs';
import { Parser } from 'acorn';
import jsx from 'acorn-jsx';
import { extend } from 'acorn-jsx-walk';
import * as walk from 'acorn-walk';

const StartContext = createContext({});
function StartProvider(props) {
  return createComponent(StartContext.Provider, {
    get value() {
      return props.context || {};
    },

    get children() {
      return props.children;
    }

  });
}

function renderAsync(fn, options) {
  return () => async (context) => {
    let markup = await renderToStringAsync(() => fn(context), options);
    if (context.routerContext.url) {
      return Response.redirect(new URL(context.routerContext.url, context.request.url), 302);
    }
    context.responseHeaders.set("Content-Type", "text/html");
    return new Response(markup, {
      status: 200,
      headers: context.responseHeaders
    });
  };
}

const MetaContext = createContext();
const cascadingTags = ["title", "meta"];

const MetaProvider = props => {
  const indices = new Map(),
        [tags, setTags] = createSignal({});
  onMount(() => {
    const ssrTags = document.head.querySelectorAll(`[data-sm=""]`); // `forEach` on `NodeList` is not supported in Googlebot, so use a workaround

    Array.prototype.forEach.call(ssrTags, ssrTag => ssrTag.parentNode.removeChild(ssrTag));
  });
  const actions = {
    addClientTag: (tag, name) => {
      // consider only cascading tags
      if (cascadingTags.indexOf(tag) !== -1) {
        setTags(tags => {
          const names = tags[tag] || [];
          return { ...tags,
            [tag]: [...names, name]
          };
        }); // track indices synchronously

        const index = indices.has(tag) ? indices.get(tag) + 1 : 0;
        indices.set(tag, index);
        return index;
      }

      return -1;
    },
    shouldRenderTag: (tag, index) => {
      if (cascadingTags.indexOf(tag) !== -1) {
        const names = tags()[tag]; // check if the tag is the last one of similar

        return names && names.lastIndexOf(names[index]) === index;
      }

      return true;
    },
    removeClientTag: (tag, index) => {
      setTags(tags => {
        const names = tags[tag];

        if (names) {
          names[index] = null;
          return { ...tags,
            [tag]: names
          };
        }

        return tags;
      });
    }
  };

  if (isServer) {
    actions.addServerTag = tagDesc => {
      const {
        tags = []
      } = props; // tweak only cascading tags

      if (cascadingTags.indexOf(tagDesc.tag) !== -1) {
        const index = tags.findIndex(prev => {
          const prevName = prev.props.name || prev.props.property;
          const nextName = tagDesc.props.name || tagDesc.props.property;
          return prev.tag === tagDesc.tag && prevName === nextName;
        });

        if (index !== -1) {
          tags.splice(index, 1);
        }
      }

      tags.push(tagDesc);
    };

    if (Array.isArray(props.tags) === false) {
      throw Error("tags array should be passed to <MetaProvider /> in node");
    }
  }

  return createComponent(MetaContext.Provider, {
    value: actions,

    get children() {
      return props.children;
    }

  });
};
function renderTags(tags) {
  return tags.map(tag => {
    const keys = Object.keys(tag.props);
    const props = keys.map(k => k === "children" ? "" : ` ${k}="${tag.props[k]}"`).join("");
    return tag.props.children ? `<${tag.tag} data-sm=""${props}>${// Tags might contain multiple text children:
    //   <Title>example - {myCompany}</Title>
    Array.isArray(tag.props.children) ? tag.props.children.join("") : tag.props.children}</${tag.tag}>` : `<${tag.tag} data-sm=""${props}/>`;
  }).join("");
}

function bindEvent(target, type, handler) {
    target.addEventListener(type, handler);
    return () => target.removeEventListener(type, handler);
}
function intercept([value, setValue], get, set) {
    return [get ? () => get(value()) : value, set ? (v) => setValue(set(v)) : setValue];
}
function scrollToHash(hash, fallbackTop) {
    const el = document.getElementById(hash);
    if (el) {
        el.scrollIntoView();
    }
    else if (fallbackTop) {
        window.scrollTo(0, 0);
    }
}
function createIntegration(get, set, init, utils) {
    let ignore = false;
    const wrap = (value) => (typeof value === "string" ? { value } : value);
    const signal = intercept(createSignal(wrap(get()), { equals: (a, b) => a.value === b.value }), undefined, next => {
        !ignore && set(next);
        return next;
    });
    init &&
        onCleanup(init((value = get()) => {
            ignore = true;
            signal[1](wrap(value));
            ignore = false;
        }));
    return {
        signal,
        utils
    };
}
function normalizeIntegration(integration) {
    if (!integration) {
        return {
            signal: createSignal({ value: "" })
        };
    }
    else if (Array.isArray(integration)) {
        return {
            signal: integration
        };
    }
    return integration;
}
function staticIntegration(obj) {
    return {
        signal: [() => obj, next => Object.assign(obj, next)]
    };
}
function pathIntegration() {
    return createIntegration(() => ({
        value: window.location.pathname + window.location.search + window.location.hash,
        state: history.state
    }), ({ value, replace, scroll, state }) => {
        if (replace) {
            window.history.replaceState(state, "", value);
        }
        else {
            window.history.pushState(state, "", value);
        }
        scrollToHash(window.location.hash.slice(1), scroll);
    }, notify => bindEvent(window, "popstate", () => notify()), {
        go: delta => window.history.go(delta)
    });
}

const hasSchemeRegex = /^(?:[a-z0-9]+:)?\/\//i;
const trimPathRegex = /^\/+|\/+$|\s+/g;
function normalize(path) {
    const s = path.replace(trimPathRegex, "");
    return s ? (s.startsWith("?") ? s : "/" + s) : "";
}
function resolvePath(base, path, from) {
    if (hasSchemeRegex.test(path)) {
        return undefined;
    }
    const basePath = normalize(base);
    const fromPath = from && normalize(from);
    let result = "";
    if (!fromPath || path.charAt(0) === "/") {
        result = basePath;
    }
    else if (fromPath.toLowerCase().indexOf(basePath.toLowerCase()) !== 0) {
        result = basePath + fromPath;
    }
    else {
        result = fromPath;
    }
    return result + normalize(path) || "/";
}
function invariant$1(value, message) {
    if (value == null) {
        throw new Error(message);
    }
    return value;
}
function joinPaths(from, to) {
    return normalize(from).replace(/\/*(\*.*)?$/g, "") + normalize(to);
}
function extractSearchParams(url) {
    const params = {};
    url.searchParams.forEach((value, key) => {
        params[key] = value;
    });
    return params;
}
function createMatcher(path, partial) {
    const [pattern, splat] = path.split("/*", 2);
    const segments = pattern.split("/").filter(Boolean);
    const len = segments.length;
    return (location) => {
        const locSegments = location.split("/").filter(Boolean);
        const lenDiff = locSegments.length - len;
        if (lenDiff < 0 || (lenDiff > 0 && splat === undefined && !partial)) {
            return null;
        }
        const match = {
            path: len ? "" : "/",
            params: {}
        };
        for (let i = 0; i < len; i++) {
            const segment = segments[i];
            const locSegment = locSegments[i];
            if (segment[0] === ":") {
                match.params[segment.slice(1)] = locSegment;
            }
            else if (segment.localeCompare(locSegment, undefined, { sensitivity: "base" }) !== 0) {
                return null;
            }
            match.path += `/${locSegment}`;
        }
        if (splat) {
            match.params[splat] = lenDiff ? locSegments.slice(-lenDiff).join("/") : "";
        }
        return match;
    };
}
function scoreRoute(route) {
    const [pattern, splat] = route.pattern.split("/*", 2);
    const segments = pattern.split("/").filter(Boolean);
    return segments.reduce((score, segment) => score + (segment.startsWith(":") ? 2 : 3), segments.length - (splat === undefined ? 0 : 1));
}
function createMemoObject(fn) {
    const map = new Map();
    const owner = getOwner();
    return new Proxy({}, {
        get(_, property) {
            if (!map.has(property)) {
                runWithOwner(owner, () => map.set(property, createMemo(() => fn()[property])));
            }
            return map.get(property)();
        },
        getOwnPropertyDescriptor() {
            return {
                enumerable: true,
                configurable: true
            };
        },
        ownKeys() {
            return Reflect.ownKeys(fn());
        }
    });
}

const MAX_REDIRECTS = 100;
const RouterContextObj = createContext();
const RouteContextObj = createContext();
const useRouter = () => invariant$1(useContext(RouterContextObj), "Make sure your app is wrapped in a <Router />");
let TempRoute;
const useRoute = () => TempRoute || useContext(RouteContextObj) || useRouter().base;
const useResolvedPath = (path) => {
    const route = useRoute();
    return createMemo(() => route.resolvePath(path()));
};
const useHref = (to) => {
    const router = useRouter();
    return createMemo(() => {
        const to_ = to();
        return to_ !== undefined ? router.renderPath(to_) : to_;
    });
};
const useLocation = () => useRouter().location;
const useRouteData = () => useRoute().data;
function createRoute(routeDef, base = "", fallback) {
    const { path: originalPath, component, data, children } = routeDef;
    const isLeaf = !children || (Array.isArray(children) && !children.length);
    const path = joinPaths(base, originalPath);
    const pattern = isLeaf ? path : path.split("/*", 1)[0];
    return {
        originalPath,
        pattern,
        element: component
            ? () => createComponent$1(component, {})
            : () => {
                const { element } = routeDef;
                return element === undefined && fallback
                    ? createComponent$1(fallback, {})
                    : element;
            },
        preload: routeDef.component
            ? component.preload
            : routeDef.preload,
        data,
        matcher: createMatcher(pattern, !isLeaf)
    };
}
function createBranch(routes, index = 0) {
    return {
        routes,
        score: scoreRoute(routes[routes.length - 1]) * 10000 - index,
        matcher(location) {
            const matches = [];
            for (let i = routes.length - 1; i >= 0; i--) {
                const route = routes[i];
                const match = route.matcher(location);
                if (!match) {
                    return null;
                }
                matches.unshift({
                    ...match,
                    route
                });
            }
            return matches;
        }
    };
}
function createBranches(routeDef, base = "", fallback, stack = [], branches = []) {
    const routeDefs = Array.isArray(routeDef) ? routeDef : [routeDef];
    for (let i = 0, len = routeDefs.length; i < len; i++) {
        const def = routeDefs[i];
        if (def && typeof def === "object" && def.hasOwnProperty("path")) {
            const route = createRoute(def, base, fallback);
            stack.push(route);
            if (def.children) {
                createBranches(def.children, route.pattern, fallback, stack, branches);
            }
            else {
                const branch = createBranch([...stack], branches.length);
                branches.push(branch);
            }
            stack.pop();
        }
    }
    // Stack will be empty on final return
    return stack.length ? branches : branches.sort((a, b) => b.score - a.score);
}
function getRouteMatches(branches, location) {
    for (let i = 0, len = branches.length; i < len; i++) {
        const match = branches[i].matcher(location);
        if (match) {
            return match;
        }
    }
    return [];
}
function createLocation(path, state) {
    const origin = new URL("http://sar");
    const url = createMemo(prev => {
        const path_ = path();
        try {
            return new URL(path_, origin);
        }
        catch (err) {
            console.error(`Invalid path ${path_}`);
            return prev;
        }
    }, origin, {
        equals: (a, b) => a.href === b.href
    });
    const pathname = createMemo(() => url().pathname);
    const search = createMemo(() => url().search.slice(1));
    const hash = createMemo(() => url().hash.slice(1));
    const key = createMemo(() => "");
    return {
        get pathname() {
            return pathname();
        },
        get search() {
            return search();
        },
        get hash() {
            return hash();
        },
        get state() {
            return state();
        },
        get key() {
            return key();
        },
        query: createMemoObject(on(search, () => extractSearchParams(url())))
    };
}
function createRouterContext(integration, base = "", data, out) {
    const { signal: [source, setSource], utils = {} } = normalizeIntegration(integration);
    const parsePath = utils.parsePath || (p => p);
    const renderPath = utils.renderPath || (p => p);
    const basePath = resolvePath("", base);
    const output = isServer && out
        ? Object.assign(out, {
            matches: [],
            url: undefined
        })
        : undefined;
    if (basePath === undefined) {
        throw new Error(`${basePath} is not a valid base path`);
    }
    else if (basePath && !source().value) {
        setSource({ value: basePath, replace: true, scroll: false });
    }
    const [isRouting, start] = useTransition();
    const [reference, setReference] = createSignal(source().value);
    const [state, setState] = createSignal(source().state);
    const location = createLocation(reference, state);
    const referrers = [];
    const baseRoute = {
        pattern: basePath,
        params: {},
        path: () => basePath,
        outlet: () => null,
        resolvePath(to) {
            return resolvePath(basePath, to);
        }
    };
    if (data) {
        try {
            TempRoute = baseRoute;
            baseRoute.data = data({
                data: undefined,
                params: {},
                location,
                navigate: navigatorFactory(baseRoute)
            });
        }
        finally {
            TempRoute = undefined;
        }
    }
    function navigateFromRoute(route, to, options) {
        // Untrack in case someone navigates in an effect - don't want to track `reference` or route paths
        untrack(() => {
            if (typeof to === "number") {
                if (!to) ;
                else if (utils.go) {
                    utils.go(to);
                }
                else {
                    console.warn("Router integration does not support relative routing");
                }
                return;
            }
            const { replace, resolve, scroll, state: nextState } = {
                replace: false,
                resolve: true,
                scroll: true,
                ...options
            };
            const resolvedTo = resolve ? route.resolvePath(to) : resolvePath("", to);
            if (resolvedTo === undefined) {
                throw new Error(`Path '${to}' is not a routable path`);
            }
            else if (referrers.length >= MAX_REDIRECTS) {
                throw new Error("Too many redirects");
            }
            const current = reference();
            if (resolvedTo !== current || nextState !== state()) {
                if (isServer) {
                    if (output) {
                        output.url = resolvedTo;
                    }
                    setSource({ value: resolvedTo, replace, scroll, state: nextState });
                }
                else {
                    const len = referrers.push({ value: current, replace, scroll, state });
                    start(() => {
                        setReference(resolvedTo);
                        setState(nextState);
                        resetErrorBoundaries();
                    }).then(() => {
                        if (referrers.length === len) {
                            navigateEnd({
                                value: resolvedTo,
                                state: nextState
                            });
                        }
                    });
                }
            }
        });
    }
    function navigatorFactory(route) {
        // Workaround for vite issue (https://github.com/vitejs/vite/issues/3803)
        route = route || useContext(RouteContextObj) || baseRoute;
        return (to, options) => navigateFromRoute(route, to, options);
    }
    function navigateEnd(next) {
        const first = referrers[0];
        if (first) {
            if (next.value !== first.value || next.state !== first.state) {
                setSource({
                    ...next,
                    replace: first.replace,
                    scroll: first.scroll
                });
            }
            referrers.length = 0;
        }
    }
    createRenderEffect(() => {
        const { value, state } = source();
        if (value !== untrack(reference)) {
            start(() => {
                setReference(value);
                setState(state);
            });
        }
    });
    if (!isServer) {
        function handleAnchorClick(evt) {
            if (evt.defaultPrevented ||
                evt.button !== 0 ||
                evt.metaKey ||
                evt.altKey ||
                evt.ctrlKey ||
                evt.shiftKey)
                return;
            const a = evt
                .composedPath()
                .find(el => el instanceof Node && el.nodeName.toUpperCase() === "A");
            if (!a)
                return;
            const isSvg = a instanceof SVGAElement;
            const href = isSvg ? a.href.baseVal : a.href;
            const target = isSvg ? a.target.baseVal : a.target;
            if (target || (!href && !a.hasAttribute("state")))
                return;
            const rel = (a.getAttribute("rel") || "").split(/\s+/);
            if (a.hasAttribute("download") || (rel && rel.includes("external")))
                return;
            const url = isSvg ? new URL(href, document.baseURI) : new URL(href);
            if (url.origin !== window.location.origin ||
                (basePath && url.pathname && !url.pathname.toLowerCase().startsWith(basePath.toLowerCase())))
                return;
            const to = parsePath(url.pathname + url.search + url.hash);
            const state = a.getAttribute("state");
            evt.preventDefault();
            navigateFromRoute(baseRoute, to, {
                resolve: false,
                replace: a.hasAttribute("replace"),
                scroll: !a.hasAttribute("noscroll"),
                state: state && JSON.parse(state)
            });
        }
        document.addEventListener("click", handleAnchorClick);
        onCleanup(() => document.removeEventListener("click", handleAnchorClick));
    }
    return {
        base: baseRoute,
        out: output,
        location,
        isRouting,
        renderPath,
        parsePath,
        navigatorFactory
    };
}
function createRouteContext(router, parent, child, match) {
    const { base, location, navigatorFactory } = router;
    const { pattern, element: outlet, preload, data } = match().route;
    const path = createMemo(() => match().path);
    const params = createMemoObject(() => match().params);
    preload && preload();
    const route = {
        parent,
        pattern,
        get child() {
            return child();
        },
        path,
        params,
        data: parent.data,
        outlet,
        resolvePath(to) {
            return resolvePath(base.path(), to, path());
        }
    };
    if (data) {
        try {
            TempRoute = route;
            route.data = data({ data: parent.data, params, location, navigate: navigatorFactory(route) });
        }
        finally {
            TempRoute = undefined;
        }
    }
    return route;
}

const _tmpl$$e = ["<a", " ", " href=\"", "\" state=\"", "\">", "</a>"];
const Router = props => {
  const {
    source,
    url,
    base,
    data,
    out
  } = props;
  const integration = source || (isServer ? staticIntegration({
    value: url || ""
  }) : pathIntegration());
  const routerState = createRouterContext(integration, base, data, out);
  return createComponent(RouterContextObj.Provider, {
    value: routerState,

    get children() {
      return props.children;
    }

  });
};
const Routes$1 = props => {
  const router = useRouter();
  const parentRoute = useRoute();
  const branches = createMemo(() => createBranches(props.children, joinPaths(parentRoute.pattern, props.base || ""), Outlet));
  const matches = createMemo(() => getRouteMatches(branches(), router.location.pathname));

  if (router.out) {
    router.out.matches.push(matches().map(({
      route,
      path,
      params
    }) => ({
      originalPath: route.originalPath,
      pattern: route.pattern,
      path,
      params
    })));
  }

  const disposers = [];
  let root;
  const routeStates = createMemo(on(matches, (nextMatches, prevMatches, prev) => {
    let equal = prevMatches && nextMatches.length === prevMatches.length;
    const next = [];

    for (let i = 0, len = nextMatches.length; i < len; i++) {
      const prevMatch = prevMatches && prevMatches[i];
      const nextMatch = nextMatches[i];

      if (prev && prevMatch && nextMatch.route.pattern === prevMatch.route.pattern) {
        next[i] = prev[i];
      } else {
        equal = false;

        if (disposers[i]) {
          disposers[i]();
        }

        createRoot(dispose => {
          disposers[i] = dispose;
          next[i] = createRouteContext(router, next[i - 1] || parentRoute, () => routeStates()[i + 1], () => matches()[i]);
        });
      }
    }

    disposers.splice(nextMatches.length).forEach(dispose => dispose());

    if (prev && equal) {
      return prev;
    }

    root = next[0];
    return next;
  }));
  return createComponent(Show, {
    get when() {
      return routeStates() && root;
    },

    children: route => createComponent(RouteContextObj.Provider, {
      value: route,

      get children() {
        return route.outlet();
      }

    })
  });
};
const useRoutes = (routes, base) => {
  return () => createComponent(Routes$1, {
    base: base,
    children: routes
  });
};
const Outlet = () => {
  const route = useRoute();
  return createComponent(Show, {
    get when() {
      return route.child;
    },

    children: child => createComponent(RouteContextObj.Provider, {
      value: child,

      get children() {
        return child.outlet();
      }

    })
  });
};

function LinkBase(props) {
  const [, rest] = splitProps(props, ["children", "to", "href", "state"]);
  const href = useHref(() => props.to);
  return ssr(_tmpl$$e, ssrHydrationKey(), ssrSpread(rest, false, true), escape(href(), true) || escape(props.href, true), escape(JSON.stringify(props.state), true), escape(props.children));
}

function Link(props) {
  const to = useResolvedPath(() => props.href);
  return createComponent(LinkBase, mergeProps(props, {
    get to() {
      return to();
    }

  }));
}

const _tmpl$$d = ["<link", " rel=\"stylesheet\" href=\"", "\">"],
      _tmpl$2$6 = ["<link", " rel=\"modulepreload\" href=\"", "\">"];

function getAssetsFromManifest(manifest, routerContext) {
  const match = routerContext.matches.reduce((memo, m) => {
    memo.push(...(manifest[mapRouteToFile(m)] || []));
    return memo;
  }, []);
  const links = match.reduce((r, src) => {
    r[src.href] = src.type === "style" ? ssr(_tmpl$$d, ssrHydrationKey(), escape(src.href, true)) : ssr(_tmpl$2$6, ssrHydrationKey(), escape(src.href, true));
    return r;
  }, {});
  return Object.values(links);
}

function mapRouteToFile(matches) {
  return matches.map(h => h.originalPath.replace(/:(\w+)/, (f, g) => `[${g}]`).replace(/\*(\w+)/, (f, g) => `[...${g}]`)).join("");
}
/**
 * Links are used to load assets for the server.
 * @returns {JSXElement}
 */


function Links() {
  const context = useContext(StartContext);
  return createComponent(Assets, {
    get children() {
      return getAssetsFromManifest(context.manifest, context.routerContext);
    }

  });
}

function Meta() {
  const context = useContext(StartContext); // @ts-expect-error The ssr() types do not match the Assets child types

  return createComponent(Assets, {
    get children() {
      return ssr(renderTags(context.tags));
    }

  });
}

const routeData$1 = ({
  params
}) => {
  return params.replId;
};

var __uno = '';

const nanoid = customAlphabet("1234567890abcdef", 10);
function generateId() {
  return generateSlug() + "-" + nanoid(3);
}

const routeData = () => {
  return generateId();
};

/// <reference path="../types.ts" />
const routes = [{
  component: lazy(() => Promise.resolve().then(function () { return ____404_; })),
  path: "/*404"
}, {
  data: routeData$1,
  component: lazy(() => Promise.resolve().then(function () { return _replId_; })),
  path: "/:replId"
}, {
  data: routeData,
  component: lazy(() => Promise.resolve().then(function () { return index; })),
  path: "/"
}, {
  component: lazy(() => Promise.resolve().then(function () { return swc; })),
  path: "/test/swc"
}, {
  component: lazy(() => Promise.resolve().then(function () { return test; })),
  path: "/test/test"
}]; // console.log(routes);

/**
 * Routes are the file system based routes, used by Solid App Router to show the current page according to the URL.
 */

const Routes = useRoutes(routes);

const _tmpl$$c = ["<script", " type=\"module\" async src=\"", "\"></script>"];

function getFromManifest(manifest) {
  const match = manifest["*"];
  const entry = match.find(src => src.type === "script");
  return ssr(_tmpl$$c, ssrHydrationKey(), escape(entry.href, true));
}

function Scripts() {
  const context = useContext(StartContext);
  return [createComponent(HydrationScript, {}), createComponent(NoHydration, {
    get children() {
      return isServer && (getFromManifest(context.manifest));
    }

  })];
}

function getDomPath(el) {
  const stack = [];
  while (el.parentNode !== null) {
    let sibCount = 0;
    let sibIndex = 0;
    for (let i = 0; i < el.parentNode.childNodes.length; i += 1) {
      const sib = el.parentNode.childNodes[i];
      if (sib.nodeName === el.nodeName) {
        if (sib === el) {
          sibIndex = sibCount;
          break;
        }
        sibCount += 1;
      }
    }
    const nodeName = CSS.escape(el.nodeName.toLowerCase());
    if (nodeName === "html")
      break;
    if (el.hasAttribute("id") && el.id !== "") {
      stack.unshift(`#${CSS.escape(el.id)}`);
      break;
    } else if (sibIndex > 0) {
      stack.unshift(`${nodeName}:nth-of-type(${sibIndex + 1})`);
    } else {
      stack.unshift(nodeName);
    }
    el = el.parentNode;
  }
  return stack;
}

const _tmpl$$b = ["<div", " class=\"bg-blue-900 opacity-10 ring ring-inset\" style=\"", "\"></div>"],
      _tmpl$2$5 = ["<head><meta charset=\"utf-8\"><meta name=\"viewport\" content=\"width=device-width, initial-scale=1\"><link rel=\"stylesheet\" href=\"https://unpkg.com/@unocss/reset@0.31.0/tailwind.css\"><script async src=\"https://ga.jspm.io/npm:es-module-shims@1.5.4/dist/es-module-shims.js\"></script><script type=\"importmap\">", "</script></head>"],
      _tmpl$3$3 = ["<div", " class=\"absolute inset-0 w-screen h-screen z-10 pointer-events-none\">", "</div>"],
      _tmpl$4$3 = ["<html", " lang=\"en\">", "<body><div id=\"root\"></div><!--#-->", "<!--/--><!--#-->", "<!--/--></body></html>"];

const HoveredElement = props => {
  return ssr(_tmpl$$b, ssrHydrationKey(), "transform:" + escape(`translate(${props.boundingClientRect.left}px, ${props.boundingClientRect.top}px)`, true) + (";width:" + escape(`${props.boundingClientRect.width}px`, true)) + (";height:" + escape(`${props.boundingClientRect.height}px`, true)));
};

const Srcdoc = () => {
  const [inspectModeEnabled, setInspectModeEnabled] = createSignal(false);
  const [hoveredElement, setHoveredElement] = createSignal();
  const [hoveredElementBoundingClientRect, setHoveredElementBoundingClientRect] = createSignal();
  const [selectedElement, setSelectedElement] = createSignal();
  let scriptEls = [];
  let styleEls = [];
  let origin;
  const cleanupFns = [];
  const importMap = {
    imports: {
      react: "https://cdn.skypack.dev/react",
      "react-dom": "https://cdn.skypack.dev/react-dom",
      "@heroicons/react": "https://cdn.skypack.dev/@heroicons/react/solid/esm",
      "@heroicons/react/solid": "https://cdn.skypack.dev/@heroicons/react/solid/esm",
      "@radix-ui/react-dropdown-menu": "https://cdn.skypack.dev/@radix-ui/react-dropdown-menu",
      "@radix-ui/react-icons": "https://cdn.skypack.dev/@radix-ui/react-icons",
      "@stitches/react": "https://cdn.skypack.dev/@stitches/react",
      "@radix-ui/colors": "https://cdn.skypack.dev/@radix-ui/colors"
    }
  };
  onMount(() => {
    cleanupFns.push(createEventListenerMap(window, {
      mousemove: e => {
        if (!inspectModeEnabled()) return;

        if (hoveredElement() !== e.target) {
          const el = e.target;
          setHoveredElement(el);
          setHoveredElementBoundingClientRect(el.getBoundingClientRect());
        }
      },
      click: e => {
        if (!inspectModeEnabled()) return;
        const ref = e.target;
        const path = getDomPath(ref);
        setSelectedElement({
          ref,
          path
        });
        setInspectModeEnabled(false);
        window.parent.postMessage({
          action: "inspect",
          path
        }, origin);
        setHoveredElement(null);
        setHoveredElementBoundingClientRect(null);
      }
    }));
    cleanupFns.push(createEventListenerMap(document.body, {
      click: e => {
        if (e.which !== 1) return;
        if (e.metaKey || e.ctrlKey || e.shiftKey) return;
        if (e.defaultPrevented) return; // ensure target is a link

        let el = e.target;

        while (el && el.nodeName !== "A") {
          el = el.parentNode;
        }

        if (!el || el.nodeName !== "A") return;
        if (el.hasAttribute("download") || el.getAttribute("rel") === "external" || el.target) return;
        e.preventDefault();

        if (el.href.startsWith(origin)) {
          const url = new URL(el.href);

          if (url.hash[0] === "#") {
            window.location.hash = url.hash;
            return;
          }
        }

        window.open(el.href, "_blank");
      },
      mouseleave: e => {
        setHoveredElement(null);
        setHoveredElementBoundingClientRect(null);
      }
    }));
    cleanupFns.push(createEventListenerMap(window, {
      message: e => {
        const {
          action
        } = e.data;
        origin = e.origin;

        if (action === "eval") {
          if (scriptEls.length) {
            scriptEls.forEach(el => {
              document.head.removeChild(el);
            });
            scriptEls.length = 0;
          } // Keep previous style around to prevent layout shift


          if (styleEls.length) {
            for (let i = 0; i < styleEls.length - 1; i++) {
              document.head.removeChild(styleEls[i]);
            }

            styleEls = styleEls.slice(-1);
          }

          try {
            const {
              scripts,
              styles
            } = e.data;

            for (const script of scripts) {
              const scriptEl = document.createElement("script");
              scriptEl.setAttribute("type", "module");
              document.head.appendChild(scriptEl);
              scriptEl.innerHTML = script; // scriptEl.innerHTML = script + `\nwindow.__next__()`
              // scriptEl.onrror = err => send_error(err.message, err.stack)

              scriptEls.push(scriptEl);
            }

            for (const style of styles) {
              const styleEl = document.createElement("style");
              document.head.appendChild(styleEl);
              styleEl.innerHTML = style;
              styleEls.push(styleEl);
            }
          } catch (e) {
            console.error(e);
          }
        } else if (action === "meta.enableInspectMode") {
          setInspectModeEnabled(true);
        } else if (action === "meta.disableInspectMode") {
          setInspectModeEnabled(false);
        }
      }
    }, false));
  });
  onCleanup(() => {
    for (const cleanup of cleanupFns) {
      cleanup();
    }
  });
  return ssr(_tmpl$4$3, ssrHydrationKey(), NoHydration({
    get children() {
      return ssr(_tmpl$2$5, JSON.stringify(importMap));
    }

  }), escape(createComponent(Show, {
    get when() {
      return inspectModeEnabled();
    },

    get children() {
      return createComponent(Portal, {
        get children() {
          return ssr(_tmpl$3$3, ssrHydrationKey(), escape(createComponent(Show, {
            get when() {
              return hoveredElementBoundingClientRect();
            },

            get children() {
              return createComponent(HoveredElement, {
                get boundingClientRect() {
                  return hoveredElementBoundingClientRect();
                }

              });
            }

          })));
        }

      });
    }

  })), escape(createComponent(Scripts, {})));
};

var index$1 = '';

function invariant(value, message) {
  if (!value) {
    throw new Error(message);
  }
  return value;
}

const RecentlyCopiedContext = createContext();
const RecentlyCopiedProvider = props => {
  const [recentlyCopied, setRecentlyCopied] = createSignal(false);
  const setRecentlyCopiedDebounced = createDebounce(setRecentlyCopied, 3000);
  const location = useLocation();
  createEffect(prevPathname => {
    if (prevPathname !== "/" && location.pathname === "/" && recentlyCopied()) {
      setRecentlyCopiedDebounced.clear();
      setRecentlyCopied(false);
    }

    return location.pathname;
  });

  function copy(s) {
    navigator.clipboard.writeText(s);
    setRecentlyCopiedDebounced.clear();
    setRecentlyCopied(true);
    setRecentlyCopiedDebounced(false);
  }

  const value = {
    recentlyCopied,
    copy
  };
  return createComponent(RecentlyCopiedContext.Provider, {
    value: value,

    get children() {
      return props.children;
    }

  });
};
function useRecentlyCopied() {
  const context = useContext(RecentlyCopiedContext);
  invariant(context, "useRecentlyCopied must be used within a RecentlyCopiedProvider");
  return context;
}

const _tmpl$$a = ["<head><title>Sailwind</title><meta charset=\"utf-8\"><meta name=\"viewport\" content=\"width=device-width, initial-scale=1\"><meta name=\"description\" content=\"A super fast Tailwind/React repl.\">", "", "<link rel=\"stylesheet\" href=\"//cdn.jsdelivr.net/npm/hack-font@3/build/web/hack-subset.css\"></head>"],
      _tmpl$2$4 = ["<html", " lang=\"en\" class=\"h-full\">", "<body class=\"antialiased h-full overflow-hidden\"><!--#-->", "<!--/--><!--#-->", "<!--/--></body></html>"];
function Root() {
  const location = useLocation();

  if (location.pathname === "/impl/srcdoc") {
    return createComponent(Srcdoc, {});
  }

  return ssr(_tmpl$2$4, ssrHydrationKey(), NoHydration({
    get children() {
      return ssr(_tmpl$$a, escape(createComponent(Meta, {})), escape(createComponent(Links, {})));
    }

  }), escape(createComponent(RecentlyCopiedProvider, {
    get children() {
      return createComponent(Routes, {});
    }

  })), escape(createComponent(Scripts, {})));
}

const rootData = Object.values({})[0];
const dataFn = rootData ? rootData.default : undefined;

/** This composes an array of Exchanges into a single ExchangeIO function */
const composeMiddleware = exchanges => ({
  ctx,
  forward
}) => exchanges.reduceRight((forward, exchange) => exchange({
  ctx: ctx,
  forward
}), forward);
function createHandler(...exchanges) {
  const exchange = composeMiddleware(exchanges);
  return async request => {
    return await exchange({
      ctx: {
        request
      },
      // fallbackExchange
      forward: async op => {
        return new Response(null, {
          status: 404
        });
      }
    })(request);
  };
}
const docType = ssr("<!DOCTYPE html>");
var StartServer = (({
  context
}) => {
  context.routerContext = {};
  context.tags = []; // @ts-expect-error

  sharedConfig.context.requestContext = context;
  const parsed = new URL(context.request.url);
  const path = parsed.pathname + parsed.search;
  return createComponent(StartProvider, {
    context: context,

    get children() {
      return createComponent(MetaProvider, {
        get tags() {
          return context.tags;
        },

        get children() {
          return createComponent(Router, {
            url: path,

            get out() {
              return context.routerContext;
            },

            data: dataFn,

            get children() {
              return [docType, createComponent(Root, {})];
            }

          });
        }

      });
    }

  });
});

class FormError extends Error {
  constructor(message, {
    fieldErrors = {},
    form,
    fields,
    stack
  } = {}) {
    super(message);
    this.formError = message;
    this.name = "FormError";
    this.fields = fields || Object.fromEntries(typeof form !== "undefined" ? form.entries() : []) || {};
    this.fieldErrors = fieldErrors;

    if (stack) {
      this.stack = stack;
    }
  }

}

const XSolidStartLocationHeader = "x-solidstart-location";
const LocationHeader = "Location";
const ContentTypeHeader = "content-type";
const XSolidStartResponseTypeHeader = "x-solidstart-response-type";
const XSolidStartContentTypeHeader = "x-solidstart-content-type";
const XSolidStartOrigin = "x-solidstart-origin";
const JSONResponseType = "application/json";
function redirect(url, init = 302) {
  let responseInit = init;
  if (typeof responseInit === "number") {
    responseInit = { status: responseInit };
  } else if (typeof responseInit.status === "undefined") {
    responseInit.status = 302;
  }
  const response = new Response(null, {
    ...responseInit,
    headers: {
      ...responseInit.headers,
      [XSolidStartLocationHeader]: url,
      [LocationHeader]: url
    }
  });
  response.context = responseInit.context;
  return response;
}
const redirectStatusCodes = /* @__PURE__ */ new Set([301, 302, 303, 307, 308]);
function isRedirectResponse(response) {
  return response && response instanceof Response && redirectStatusCodes.has(response.status);
}
class ResponseError extends Error {
  constructor(response) {
    let message = JSON.stringify({
      $type: "response",
      status: response.status,
      message: response.statusText,
      headers: [...response.headers.entries()]
    });
    super(message);
    this.name = "ResponseError";
    this.status = response.status;
    this.headers = new Map([...response.headers.entries()]);
    this.url = response.url;
    this.ok = response.ok;
    this.statusText = response.statusText;
    this.redirected = response.redirected;
    this.bodyUsed = false;
    this.type = response.type;
    this.response = () => response;
  }
  clone() {
    return this.response();
  }
  get body() {
    return this.response().body;
  }
  async arrayBuffer() {
    return await this.response().arrayBuffer();
  }
  async blob() {
    return await this.response().blob();
  }
  async formData() {
    return await this.response().formData();
  }
  async text() {
    return await this.response().text();
  }
  async json() {
    return await this.response().json();
  }
}
function respondWith(request, data, responseType) {
  if (data instanceof ResponseError) {
    data = data.clone();
  }
  if (data instanceof Response) {
    if (isRedirectResponse(data) && request.headers.get(XSolidStartOrigin) === "client") {
      data.headers.set(XSolidStartOrigin, "server");
      data.headers.set(XSolidStartLocationHeader, data.headers.get(LocationHeader));
      data.headers.set(XSolidStartResponseTypeHeader, responseType);
      data.headers.set(XSolidStartContentTypeHeader, "response");
      return new Response(null, {
        status: 204,
        headers: data.headers
      });
    } else {
      data.headers.set(XSolidStartResponseTypeHeader, responseType);
      data.headers.set(XSolidStartContentTypeHeader, "response");
      return data;
    }
  } else if (data instanceof FormError) {
    return new Response(JSON.stringify({
      error: {
        message: data.message,
        stack: data.stack,
        formError: data.formError,
        fields: data.fields,
        fieldErrors: data.fieldErrors
      }
    }), {
      status: 400,
      headers: {
        [XSolidStartResponseTypeHeader]: responseType,
        [XSolidStartContentTypeHeader]: "form-error"
      }
    });
  } else if (data instanceof Error) {
    return new Response(JSON.stringify({
      error: {
        message: data.message,
        stack: data.stack,
        status: data.status
      }
    }), {
      status: data.status || 500,
      headers: {
        [XSolidStartResponseTypeHeader]: responseType,
        [XSolidStartContentTypeHeader]: "error"
      }
    });
  } else if (typeof data === "object" || typeof data === "string" || typeof data === "number" || typeof data === "boolean") {
    return new Response(JSON.stringify(data), {
      status: 200,
      headers: {
        [ContentTypeHeader]: "application/json",
        [XSolidStartResponseTypeHeader]: responseType,
        [XSolidStartContentTypeHeader]: "json"
      }
    });
  }
  return new Response("null", {
    status: 200,
    headers: {
      [ContentTypeHeader]: "application/json",
      [XSolidStartContentTypeHeader]: "json",
      [XSolidStartResponseTypeHeader]: responseType
    }
  });
}
async function parseResponse(request, response) {
  const contentType = response.headers.get(XSolidStartContentTypeHeader) || response.headers.get(ContentTypeHeader) || "";
  if (contentType.includes("json")) {
    return await response.json();
  } else if (contentType.includes("text")) {
    return await response.text();
  } else if (contentType.includes("form-error")) {
    const data = await response.json();
    return new FormError(data.error.message, {
      fieldErrors: data.error.fieldErrors,
      fields: data.error.fields,
      stack: data.error.stack
    });
  } else if (contentType.includes("error")) {
    const data = await response.json();
    const error = new Error(data.error.message);
    if (data.error.stack) {
      error.stack = data.error.stack;
    }
    return error;
  } else if (contentType.includes("response")) {
    if (response.status === 204 && response.headers.get(LocationHeader)) {
      return redirect(response.headers.get(LocationHeader));
    }
    return response;
  } else {
    if (response.status === 200) {
      const text = await response.text();
      try {
        return JSON.parse(text);
      } catch {
      }
    }
    if (response.status === 204 && response.headers.get(LocationHeader)) {
      return redirect(response.headers.get(LocationHeader));
    }
    return response;
  }
}

const server = (fn) => {
  throw new Error("Should be compiled away");
};
Object.defineProperty(server, "request", {
  get() {
    throw new Error("Should be compiled away");
  }
});
Object.defineProperty(server, "responseHeaders", {
  get() {
    throw new Error("Should be compiled away");
  }
});
if (!isServer || undefined === "client") {
  let createRequestInit = function(...args) {
    let body, headers = {
      [XSolidStartOrigin]: "client"
    };
    if (args.length === 1 && args[0] instanceof FormData) {
      body = args[0];
    } else {
      if (Array.isArray(args) && args.length > 2) {
        let secondArg = args[1];
        if (typeof secondArg === "object" && "value" in secondArg && "refetching" in secondArg) {
          secondArg.value = void 0;
        }
      }
      body = JSON.stringify(args, (key, value) => {
        if (value instanceof Headers) {
          return {
            $type: "headers",
            values: [...value.entries()]
          };
        }
        if (value instanceof Request) {
          return {
            $type: "request",
            url: value.url,
            method: value.method,
            headers: value.headers
          };
        }
        return value;
      });
      headers[ContentTypeHeader] = JSONResponseType;
    }
    return {
      method: "POST",
      body,
      headers: {
        ...headers
      }
    };
  };
  server.fetcher = fetch;
  server.setFetcher = (fetch2) => {
    server.fetcher = fetch2;
  };
  server.createFetcher = (route) => {
    let fetcher = function(...args) {
      const requestInit = createRequestInit(...args);
      return server.fetch(route, requestInit);
    };
    fetcher.url = route;
    fetcher.fetch = (init) => server.fetch(route, init);
    fetcher.action = async (...args) => {
      const requestInit = createRequestInit(...args);
      return server.fetch(route, requestInit);
    };
    return fetcher;
  };
  server.fetch = async function(route, init) {
    const request = new Request(new URL(route, window.location.href).href, init);
    const handler = server.fetcher;
    const response = await handler(request);
    if (response.headers.get(XSolidStartResponseTypeHeader) === "throw") {
      throw await parseResponse(request, response);
    } else {
      return await parseResponse(request, response);
    }
  };
}
async function parseRequest(request) {
  let contentType = request.headers.get(ContentTypeHeader);
  let name = new URL(request.url).pathname, args = [];
  if (contentType) {
    if (contentType === JSONResponseType) {
      let text = await request.text();
      try {
        args = JSON.parse(text, (key, value) => {
          if (!value) {
            return value;
          }
          if (value.$type === "headers") {
            let headers = new Headers();
            request.headers.forEach((value2, key2) => headers.set(key2, value2));
            value.values.forEach(([key2, value2]) => headers.set(key2, value2));
            return headers;
          }
          if (value.$type === "request") {
            return new Request(value.url, {
              method: value.method,
              headers: value.headers
            });
          }
          return value;
        });
      } catch (e) {
        throw new Error(`Error parsing request body: ${text}`);
      }
    } else if (contentType.includes("form")) {
      let formData = await request.formData();
      args = [formData];
    }
  }
  return [name, args];
}
async function handleServerRequest(ctx) {
  const url = new URL(ctx.request.url);
  if (server.hasHandler(url.pathname)) {
    try {
      let [name, args] = await parseRequest(ctx.request);
      let handler = server.getHandler(name);
      if (!handler) {
        throw {
          status: 404,
          message: "Handler Not Found for " + name
        };
      }
      const data = await handler.call(ctx, ...Array.isArray(args) ? args : [args]);
      return respondWith(ctx.request, data, "return");
    } catch (error) {
      return respondWith(ctx.request, error, "throw");
    }
  }
  return null;
}
if (isServer || undefined === "client") {
  const handlers = /* @__PURE__ */ new Map();
  server.createHandler = (_fn, hash) => {
    let fn = function(...args) {
      let ctx;
      if (typeof this === "object" && this.request instanceof Request) {
        ctx = this;
      } else if (sharedConfig.context && sharedConfig.context.requestContext) {
        ctx = sharedConfig.context.requestContext;
      } else {
        ctx = {
          request: new URL(hash, "http://localhost:3000").href,
          responseHeaders: new Headers()
        };
      }
      const execute = async () => {
        try {
          let e = await _fn.call(ctx, ...args);
          return e;
        } catch (e) {
          if (e instanceof Response) {
            if (ctx) {
              let responseHeaders = ctx.responseHeaders;
              responseHeaders.set("x-solidstart-status-code", e.status.toString());
              e.headers.forEach((head, value) => {
                responseHeaders.set(value, head);
              });
            }
            throw new ResponseError(e);
          }
          if (/[A-Za-z]+ is not defined/.test(e.message)) {
            const error = new Error(e.message + "\n You probably are using a variable defined in a closure in your server function.");
            error.stack = e.stack;
            throw error;
          }
          throw e;
        }
      };
      return execute();
    };
    fn.url = hash;
    fn.action = function(...args) {
      return fn.call(this, ...args);
    };
    return fn;
  };
  server.registerHandler = function(route, handler) {
    handlers.set(route, handler);
  };
  server.getHandler = function(route) {
    return handlers.get(route);
  };
  server.hasHandler = function(route) {
    return handlers.has(route);
  };
}
const inlineServerModules = ({ forward }) => {
  return async (ctx) => {
    const url = new URL(ctx.request.url);
    if (server.hasHandler(url.pathname)) {
      let contentType = ctx.request.headers.get("content-type");
      let origin = ctx.request.headers.get("x-solidstart-origin");
      let formRequestBody;
      if (contentType != null && contentType.includes("form") && !(origin != null && origin.includes("client"))) {
        let [read1, read2] = ctx.request.body.tee();
        formRequestBody = new Request(ctx.request.url, {
          body: read2,
          headers: ctx.request.headers,
          method: ctx.request.method
        });
        ctx.request = new Request(ctx.request.url, {
          body: read1,
          headers: ctx.request.headers,
          method: ctx.request.method
        });
      }
      const serverResponse = await handleServerRequest(ctx);
      let responseContentType = serverResponse.headers.get("x-solidstart-content-type");
      if (formRequestBody && responseContentType !== null && responseContentType.includes("error")) {
        const formData = await formRequestBody.formData();
        let entries = [...formData.entries()];
        return new Response(null, {
          status: 302,
          headers: {
            Location: new URL(ctx.request.headers.get("referer")).pathname + "?form=" + encodeURIComponent(JSON.stringify({
              url: url.pathname,
              entries,
              ...await serverResponse.json()
            }))
          }
        });
      }
      return serverResponse;
    }
    const response = await forward(ctx);
    if (ctx.responseHeaders.get("x-solidstart-status-code")) {
      return new Response(response.body, {
        status: parseInt(ctx.responseHeaders.get("x-solidstart-status-code")),
        headers: response.headers
      });
    }
    return response;
  };
};

var entryServer = createHandler(inlineServerModules, renderAsync(context => createComponent(StartServer, {
  context: context
})));

const _tmpl$$9 = ["<main", " class=\"text-center mx-auto text-gray-700 p-4\"><h1 class=\"max-6-xs text-6xl text-sky-700 font-thin uppercase my-16\">Not Found</h1><p class=\"mt-8\">Visit <!--#-->", "<!--/--> to learn how to build Solid apps.</p><p class=\"my-4\"><!--#-->", "<!--/--> - <!--#-->", "<!--/--></p></main>"];
function NotFound() {
  return ssr(_tmpl$$9, ssrHydrationKey(), escape(createComponent(Link, {
    href: "https://solidjs.com",
    target: "_blank",
    "class": "text-sky-600 hover:underline",
    children: "solidjs.com"
  })), escape(createComponent(Link, {
    href: "/",
    "class": "text-sky-600 hover:underline",
    children: "Home"
  })), escape(createComponent(Link, {
    href: "/about",
    "class": "text-sky-600 hover:underline",
    children: "About Page"
  })));
}

var ____404_ = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  'default': NotFound
}, Symbol.toStringTag, { value: 'Module' }));

function isJSXElement(node) {
  return node.type === "JSXElement";
}

const parser = Parser.extend(jsx());
extend(walk.base);
class Found {
  constructor(node, state) {
    this.node = node;
    this.state = state;
  }
}
function findJSXElement(node, position) {
  try {
    walk.simple(node, {
      JSXElement(node2) {
        if (node2.start <= position && node2.end >= position) {
          throw new Found(node2);
        }
      }
    });
  } catch (e) {
    if (e instanceof Found) {
      invariant$2(isJSXElement(e.node), "Node is not a JSXElement");
      return e.node;
    }
    throw e;
  }
}
const regex = /:nth-of-type\((\d+)\)/g;
function getNth(selector) {
  const match = regex.exec(selector);
  if (match) {
    return parseInt(match[1], 10);
  }
  return 0;
}
function findJSXElementFromPath(node, path) {
  try {
    walk.recursive(node, { path, n: 0, iPath: 0 }, {
      JSXElement(node2, state, c) {
        const selector = state.path[state.iPath];
        const nth = getNth(selector);
        const name = node2.openingElement?.name?.name;
        if (nth !== state.n) {
          return;
        }
        if (state.iPath === state.path.length - 1 && selector.startsWith(name)) {
          throw new Found(node2);
        }
        if (selector.startsWith(name)) {
          let i = 0;
          for (const child of node2.children) {
            if (child?.type !== "JSXElement") {
              continue;
            }
            c(child, { ...state, n: i, iPath: state.iPath + 1 });
            i += 1;
          }
        }
      }
    });
  } catch (e) {
    if (e instanceof Found) {
      invariant$2(isJSXElement(e.node), "Node is not a JSXElement");
      return e.node;
    }
    console.error(e);
    throw e;
  }
}

const SyncContext = createContext();

function getIndexeddbProvider(docId, ydoc, yText, defaultValue) {
  if (isServer) {
    return undefined;
  }

  const indexeddbProvider = new IndexeddbPersistence(docId, ydoc);
  onMount(() => {
    indexeddbProvider.once("synced", () => {
      console.log("Synced IndexedDB!");

      if (defaultValue && yText.length === 0) {
        console.log("Init code");
        yText.insert(0, defaultValue);
      }
    });
  });
  onCleanup(() => {
    indexeddbProvider.destroy();
  });
  return indexeddbProvider;
}

function getWebsocketProvider(wsUrl, docId, ydoc, enableWebsocketProvider) {
  if (isServer) {
    return undefined;
  }

  if (location.protocol === "https:") {
    wsUrl = wsUrl.replace("ws://", "wss://");
  }

  const wsProvider = new WebsocketProvider(wsUrl, docId, ydoc, {
    connect: enableWebsocketProvider
  });
  onMount(() => {
    wsProvider.once("synced", () => {
      console.log("Synced Websocket!");
    });
  });
  onCleanup(() => {
    wsProvider.destroy();
  });
  return wsProvider;
}

function getUndoManager(yText) {
  const undoManager = new Y.UndoManager(yText, {
    // Add all origins that you want to track. The editor binding adds itself automatically.
    trackedOrigins: new Set([])
  });
  return undoManager;
} // const importMap = {
//   react: "https://cdn.skypack.dev/react",
//   "react-dom": "https://cdn.skypack.dev/react-dom",
//   "@heroicons/react": "https://cdn.skypack.dev/@heroicons/react/solid/esm",
// };
// function remapImports(code: string) {}


const SyncProvider = props => {
  props = mergeProps$1({
    enableWebsocketProvider: false,
    defaultValue: ""
  }, props);
  const [local, rest] = splitProps(props, ["ydoc", "docId", "enableWebsocketProvider", "defaultValue"]);
  const [errors, setErrors] = createSignal([]);
  const [code, setCode] = createSignal(null);
  const ydoc = local.ydoc ?? new Y.Doc();
  const yText = ydoc.getText("codemirror");
  onMount(() => {
    yText.observe(() => {
      setCode(yText.toJSON());
    });
  });
  const outputJavascript = createMemo(() => {
    if (!code()) {
      return "";
    }

    try {
      setErrors(e => e.filter(e => e.type !== "script")); // const remappedImports = remapImports(code());

      const compiled = transform(code(), {
        transforms: ["typescript", "jsx"]
      });
      return compiled.code;
    } catch (error) {
      setErrors(e => [...e, {
        type: "script",
        message: error.message
      }]);
      console.log(error);
      return error.message;
    }
  });
  const uno = createGenerator({
    presets: [presetUno()]
  });
  const [outputCss] = createResource(code, async code => {
    if (!code) {
      return "";
    }

    try {
      setErrors(e => e.filter(e => e.type !== "style"));
      const styles = await uno.generate(code);
      return styles.css;
    } catch (error) {
      setErrors(e => [...e, {
        type: "style",
        message: error.message
      }]);
      console.log(error);
      return "An error.";
    }
  });
  const ast = createMemo(() => {
    if (!code()) {
      return null;
    }

    try {
      return parser.parse(code(), {
        sourceType: "module",
        ecmaVersion: 2022
      });
    } catch (error) {
      console.log(error);
      return null;
    }
  });
  const indexeddbProvider = getIndexeddbProvider(local.docId, ydoc, yText, local.defaultValue);
  const wsProvider = getWebsocketProvider( // @ts-ignore
  "ws://localhost:8080", local.docId, ydoc, local.enableWebsocketProvider);
  const undoManager = getUndoManager(yText);
  const value = { ...local,
    ydoc,
    yText,
    indexeddbProvider,
    wsProvider,
    undoManager,
    code,
    outputJavascript,
    outputCss,
    errors,
    ast
  };
  return createComponent(SyncContext.Provider, {
    value: value,

    get children() {
      return rest.children;
    }

  });
};
function useSync() {
  const context = useContext(SyncContext);
  invariant(context, "useCode must be used within a SyncProvider");
  return context;
}

const ControlsContext = createContext();
const ControlsProvider = props => {
  const [iframeRef, setIframeRef] = createSignal();
  const [iframeLoaded, setIframeLoaded] = createSignal(false);
  const [isInspecting, setIsInspecting] = createSignal(false);
  const [showRightPanel, setShowRightPanel] = createSignal(true);
  const [showCode, setShowCode] = createSignal(true);
  const [selectedNode, setSelectedNode] = createSignal();
  const [inspectedElementPath, setInspectedElementPath] = createSignal([]);
  return createComponent(ControlsContext.Provider, {
    value: {
      iframeRef,
      setIframeRef,
      iframeLoaded,
      setIframeLoaded,
      isInspecting,
      setIsInspecting,
      showRightPanel,
      setShowRightPanel,
      showCode,
      setShowCode,
      selectedNode,
      setSelectedNode,
      inspectedElementPath,
      setInspectedElementPath
    },

    get children() {
      return props.children;
    }

  });
};
function useControls() {
  const context = useContext(ControlsContext);
  useSync();
  invariant(context, "usePreviewContext must be used within a PreviewProvider");

  function evalScripts(script) {
    const iframe = context.iframeRef();

    if (iframe) {
      const scripts = Array.isArray(script) ? script : [script];
      iframe.contentWindow.postMessage({
        action: "eval",
        scripts,
        styles: []
      }, "*");
    }
  }

  function evalStyles(style) {
    const iframe = context.iframeRef();

    if (iframe) {
      const styles = Array.isArray(style) ? style : [style];
      iframe.contentWindow.postMessage({
        action: "eval",
        scripts: [],
        styles
      }, "*");
    }
  }

  createEffect(() => {
    const iframe = context.iframeRef();

    if (!iframe) {
      return;
    }

    if (context.isInspecting()) {
      iframe.contentWindow.postMessage({
        action: "meta.enableInspectMode"
      });
    } else {
      iframe.contentWindow.postMessage({
        action: "meta.disableInspectMode"
      });
    }
  });

  function messageHandler(e) {
    const {
      action
    } = e.data;

    if (action === "inspect") {
      context.setIsInspecting(false);
      context.setInspectedElementPath(e.data.path);
    }
  }

  onMount(() => {
    window.addEventListener("message", messageHandler, false);
  });
  onCleanup(() => {
    window.removeEventListener("message", messageHandler, false);
  });
  return { ...context,
    evalScripts,
    evalStyles
  };
}

const _tmpl$$8 = ["<span", " class=\"", "\">", "</span>"],
      _tmpl$2$3 = ["<span", " class=\"flex items-center font-hack text-xs px-2 h-full border rounded-r text-gray-600 group-hover:text-gray-900 transition\">", "</span>"],
      _tmpl$3$2 = ["<div", " class=\"px-2 py-1 border-b grid grid-cols-2 shrink-0\"><div class=\"flex items-center\"><!--#-->", "<!--/--><p class=\"ml-4 text-xs\">A super fast Tailwind repl.</p><a href=\"https://github.com/lawrencecchen/sailwind\" rel=\"noopener noreferrer\" target=\"_blank\" class=\"flex items-center ml-2\" aria-label=\"View on GitHub\"><span class=\"i-mdi-github w-5 h-5\"></span></a></div><div class=\"ml-auto mr-0 space-x-2 flex\"><!--#-->", "<!--/--><button class=\"", "\" aria-label=\"Toggle show code\"><span class=\"i-carbon-code w-5 h-5\"></span></button><button class=\"", "\" aria-label=\"Toggle right sidebar\"><span class=\"i-carbon-open-panel-filled-right w-5 h-5\"></span></button></div></div>"],
      _tmpl$4$2 = ["<span", " class=\"flex items-center\">Share <span class=\"i-ic-round-share bg-gray-500 w-3.5 h-3.5 ml-1 group-hover:bg-gray-700 transition\"></span></span>"];
const Header = props => {
  const {
    recentlyCopied,
    copy
  } = useRecentlyCopied();
  const {
    showRightPanel,
    setShowRightPanel,
    showCode,
    setShowCode
  } = useControls();
  return ssr(_tmpl$3$2, ssrHydrationKey(), escape(createComponent(Link, {
    href: "/",
    "class": "font-bold",
    children: "Sailwind"
  })), escape(createComponent(Link, {
    get href() {
      return "/" + props.replId;
    },

    "class": "ml-2 text-sm group flex items-center h-7",
    onClick: e => {
      copy(window.location.origin + "/" + props.replId);
    },

    get children() {
      return [ssr(_tmpl$$8, ssrHydrationKey(), `flex items-center bg-gray-50 border rounded-l px-2 h-full font-medium transition ${recentlyCopied() ? "text-blue-600 bg-blue-100" : ""} ${!recentlyCopied() ? "text-gray-700 group-hover:bg-gray-100 group-hover:text-gray-800" : ""} ${!props.showId ? "rounded-r" : ""}`, escape(createComponent(Show, {
        get when() {
          return recentlyCopied();
        },

        get fallback() {
          return ssr(_tmpl$4$2, ssrHydrationKey());
        },

        children: "Copied!"
      }))), createComponent(Show, {
        get when() {
          return props.showId;
        },

        get children() {
          return ssr(_tmpl$2$3, ssrHydrationKey(), escape(props.replId));
        }

      })];
    }

  })), `flex items-center p-1 ${showCode() ? "text-blue-500" : ""} ${!showCode() ? "text-gray-500" : ""}`, `flex items-center p-1 ${showRightPanel() ? "text-blue-500" : ""} ${!showRightPanel() ? "text-gray-500" : ""}`);
};

const _tmpl$$7 = ["<div", " class=\"h-full flex-grow\"></div>"];
const customTheme = EditorView.theme({
  ".cm-content": {
    fontFamily: "Hack, monospace",
    fontSize: "12px"
  }
});
const CodeMirrorContext = createContext();
const CodeMirrorProvider = props => {
  props = mergeProps$1({
    extensions: []
  }, props);
  const {
    yText,
    undoManager,
    wsProvider
  } = useSync();
  const [editorState, setEditorState] = createSignal();
  const [editorView, setEditorView] = createSignal();
  const [editorRef, setEditorRef] = createSignal();
  const updateListeners = [];

  function handleUpdate(v) {
    for (const listener of updateListeners) {
      listener(v);
    }
  }

  onMount(() => {
    const state = EditorState.create({
      extensions: [basicSetup, keymap.of([indentWithTab]), javascript({
        jsx: true,
        typescript: true
      }), yCollab(yText, wsProvider.awareness, {
        undoManager
      }), EditorView.updateListener.of(handleUpdate), EditorState.allowMultipleSelections.of(true), customTheme, ...props.extensions]
    });
    setEditorState(state);
  });
  createEffect(() => {
    if (editorRef() && editorState()) {
      const view = new EditorView({
        state: editorState(),
        parent: editorRef()
      });
      setEditorView(view);
    }
  });
  return createComponent(CodeMirrorContext.Provider, {
    value: {
      editorState,
      setEditorState,
      editorView,
      setEditorView,
      editorRef,
      setEditorRef,
      updateListeners
    },

    get children() {
      return props.children;
    }

  });
};
function useCodeMirror(props) {
  const context = useContext(CodeMirrorContext);
  invariant$2(context, "useCodeMirror must be used within a CodeMirrorProvider");

  if (props?.updateListener) {
    context.updateListeners.push(props.updateListener);
    onCleanup(() => {
      context.updateListeners.splice(context.updateListeners.indexOf(props.updateListener), 1);
    });
  }

  return context;
}
const CodeMirror = props => {
  useCodeMirror();
  return ssr(_tmpl$$7, ssrHydrationKey());
};
const DEFAULT_CODE_2 = `import React from "react";
import ReactDOM from "react-dom";

function App() {
  return <div className="relative flex min-h-screen flex-col justify-center overflow-hidden bg-gray-50 py-6 sm:py-12">
    <img
      src="https://play.tailwindcss.com/img/beams.jpg"
      alt=""
      className="absolute top-1/2 left-1/2 max-w-none -translate-x-1/2 -translate-y-1/2"
      width={1308}
    />
    <div className="absolute inset-0 bg-[url(https://play.tailwindcss.com/img/grid.svg)] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]" />
    <div className="relative bg-white px-6 pt-10 pb-8 shadow-xl ring-1 ring-gray-900/5 sm:mx-auto sm:max-w-lg sm:rounded-lg sm:px-10">
      <div className="mx-auto max-w-md">
        <h1 className="text-2xl font-medium">Sailwind</h1>
        <div className="divide-y divide-gray-300/50">
          <div className="space-y-6 pb-8 pt-4 text-base leading-7 text-gray-600">
            <p>
              A super fast playground for Tailwind CSS, built with Solid.
            </p>
            <ul className="space-y-4">
              <li className="flex items-center">
                <svg
                  className="h-6 w-6 flex-none fill-sky-100 stroke-sky-500 stroke-2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx={12} cy={12} r={11} />
                  <path
                    d="m8 13 2.165 2.165a1 1 0 0 0 1.521-.126L16 9"
                    fill="none"
                  />
                </svg>
                <p className="ml-4">
                  Instant response. Start typing and see!
                </p>
              </li>
              <li className="flex items-center">
                <svg
                  className="h-6 w-6 flex-none fill-sky-100 stroke-sky-500 stroke-2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx={12} cy={12} r={11} />
                  <path
                    d="m8 13 2.165 2.165a1 1 0 0 0 1.521-.126L16 9"
                    fill="none"
                  />
                </svg>
                <p className="ml-4">
                  Multiplayer (click share on the top right!)
                </p>
              </li>
              <li className="flex items-center">
                <svg
                  className="h-6 w-6 flex-none fill-sky-100 stroke-sky-500 stroke-2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx={12} cy={12} r={11} />
                  <path
                    d="m8 13 2.165 2.165a1 1 0 0 0 1.521-.126L16 9"
                    fill="none"
                  />
                </svg>
                <p className="ml-4">Code completion with instant preview</p>
              </li>
            </ul>
            <p>
              Perfect for learning how the framework works, prototyping a new
              idea, or creating a demo to share online.
            </p>
          </div>
          <div className="pt-8 text-base font-semibold leading-7">
            <p className="text-gray-900">Check out some examples:</p>
            <p className="flex flex-col">
              <a
                href="https://sailwind.dev/most-agreeable-hydrogen-4e1"
                className="text-sky-500 hover:text-sky-600"
              >
                Modal →
              </a>
              <a
                href="https://sailwind.dev/better-aggressive-cartoon-8b8"
                className="text-sky-500 hover:text-sky-600"
              >
                Sign in page →
              </a>
              <a
                href="https://sailwind.dev/brash-angry-nightfall-ac1"
                className="text-sky-500 hover:text-sky-600"
              >
                Hot toasts →
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
}

ReactDOM.render(<App />, document.getElementById("root"));`;

const _tmpl$$6 = ["<div", " class=\"absolute top-2 right-2 bg-white border shadow-md rounded-2xl px-2 py-1 text-xs font-hack text-gray-600\">", "</div>"],
      _tmpl$2$2 = ["<iframe", " src=\"/impl/srcdoc\" sandbox=\"allow-forms allow-modals allow-pointer-lock allow-popups allow-same-origin allow-scripts allow-top-navigation-by-user-activation\" class=\"h-full w-full border-l\"></iframe>"],
      _tmpl$3$1 = ["<div", " class=\"absolute left-1/2 right-1/2 top-1/2 transform -translate-y-1/2\"><div aria-label=\"Loading...\" class=\"i-gg-spinner w-8 h-8 animate-spin bg-gray-500\"></div></div>"],
      _tmpl$4$1 = ["<div", " style=\"", "\" class=\"shrink-0 h-full relative grow\"><!--#-->", "<!--/--><div class=\"absolute -left-1 h-full w-2  cursor-ew-resize\"></div><!--#-->", "<!--/--></div>"],
      _tmpl$5$1 = ["<p", ">An error occurred</p>"];
const Preview = props => {
  const [previewWidth, setPreviewWidth] = createSignal(500);
  const [resizing, setResizing] = createSignal(false);
  const {
    setIframeRef,
    iframeLoaded,
    setIframeLoaded,
    evalScripts,
    evalStyles,
    showRightPanel
  } = useControls();
  const {
    showCode
  } = useControls();
  createDebounce$1(setResizing, 1000);
  createEffect(() => {
    if (iframeLoaded() && props.errors.length === 0) {
      if (props.scripts) {
        evalScripts(props.scripts);
      }

      if (props.styles) {
        evalStyles(props.styles);
      }
    }
  });

  function getWidth(previewWidth, showCode, showRightPanel) {
    if (showRightPanel) {
      return `min(calc(100% - 241px - 50px), ${previewWidth}px)`;
    }

    if (!showCode) {
      return "auto";
    }

    if (previewWidth) {
      return previewWidth + "px";
    }

    return "50%";
  }

  return ssr(_tmpl$4$1, ssrHydrationKey(), "width:" + escape(getWidth(previewWidth(), showCode(), showRightPanel()), true) + (";min-width:" + "320px") + (";max-width:" + escape(showCode() ? "calc(100% - 50px)" : "100%", true)), escape(createComponent(Transition, {
    exitClass: "opacity-100",
    exitToClass: "opacity-0",
    exitActiveClass: "duration-200 transition",

    get children() {
      return createComponent(Show, {
        get when() {
          return resizing();
        },

        get children() {
          return ssr(_tmpl$$6, ssrHydrationKey(), escape(previewWidth()));
        }

      });
    }

  })), escape(createComponent(Show, {
    get when() {
      return props.errors.length === 0;
    },

    get fallback() {
      return ssr(_tmpl$5$1, ssrHydrationKey());
    },

    get children() {
      return [ssr(_tmpl$2$2, ssrHydrationKey()), createComponent(Transition, {
        exitClass: "opacity-100",
        exitToClass: "opacity-0",
        exitActiveClass: "duration-200 transition",

        get children() {
          return createComponent(Show, {
            get when() {
              return !iframeLoaded();
            },

            get children() {
              return ssr(_tmpl$3$1, ssrHydrationKey());
            }

          });
        }

      })];
    }

  })));
};

const _tmpl$2$1 = ["<div", " class=\"", "\"><div class=\"", "\"></div><div class=\"h-4 w-4 grid place-items-center bg-white transform\"><input type=\"text\" class=\"rounded-sm border-gray-400 w-5 h-3.5 border text-xs text-center text-gray-800 tabular-nums\" value=\"", "\"></div></div>"],
      _tmpl$3 = ["<div", " class=\"", "\"><div class=\"col-span-1 text-xs font-medium text-gray-500 text-right\">", "</div><div class=\"col-span-3 h-14 border border-gray-300 rounded-lg relative\"><div class=\"absolute inset-0 p-3 grid place-content-center\"><div class=\"text-xs text-gray-600\">auto</div></div><!--#-->", "<!--/--><!--#-->", "<!--/--><!--#-->", "<!--/--><!--#-->", "<!--/--></div></div>"];

const SpacingInput = props => {
  const orientation = props.direction === "left" || props.direction === "right" ? "horizontal" : "vertical";
  return ssr(_tmpl$2$1, ssrHydrationKey(), `grid place-items-center absolute inset-0 transform ${props.direction === "left" ? "w-4 right-auto -translate-x-1/2" : ""} ${props.direction === "top" ? "h-4 bottom-auto -translate-y-1/2" : ""} ${props.direction === "right" ? "w-4 left-auto translate-x-1/2" : ""} ${props.direction === "bottom" ? "h-4 top-auto translate-y-1/2" : ""}`, `absolute inset-0 ${orientation === "horizontal" ? "cursor-ew-resize" : ""} ${orientation === "vertical" ? "cursor-ns-resize" : ""}`, escape(props.displayValue, true) ?? escape(props.value, true));
};

const SpacingControl = props => {
  const [spacing, setSpacing] = createSignal({
    top: 0,
    right: 0,
    bottom: 0,
    left: 0
  });
  const displaySpacing = createMemo(() => {
    return Object.fromEntries(Object.entries(spacing()).map(([k, v]) => [k, Math.floor(v / 20)]));
  });
  createEffect(() => {
    props.onInput?.(displaySpacing());
  });
  return ssr(_tmpl$3, ssrHydrationKey(), `items-center w-full grid grid-cols-4 gap-x-12 ${!!props.class ? escape(escape(props.class, true), true) : ""}`, escape(props.label), escape(createComponent(SpacingInput, {
    get value() {
      return spacing().left;
    },

    get displayValue() {
      return displaySpacing().left;
    },

    direction: "left",
    onInput: v => {
      setSpacing(s => ({ ...s,
        left: Number(v)
      }));
      console.log(spacing());
    }
  })), escape(createComponent(SpacingInput, {
    get value() {
      return spacing().top;
    },

    get displayValue() {
      return displaySpacing().top;
    },

    direction: "top",
    onInput: v => {
      setSpacing(s => ({ ...s,
        top: Number(v)
      }));
    }
  })), escape(createComponent(SpacingInput, {
    get value() {
      return spacing().right;
    },

    get displayValue() {
      return displaySpacing().right;
    },

    direction: "right",
    onInput: v => {
      setSpacing(s => ({ ...s,
        right: Number(v)
      }));
    }
  })), escape(createComponent(SpacingInput, {
    get value() {
      return spacing().bottom;
    },

    get displayValue() {
      return displaySpacing().bottom;
    },

    direction: "bottom",
    onInput: v => {
      setSpacing(s => ({ ...s,
        bottom: Number(v)
      }));
    }
  })));
};

const _tmpl$$5 = ["<div", " class=\"", "\"><div class=\"text-xs font-semibold text-gray-900 px-4 py-3\">", "</div><div class=\"px-4 py-1 flex flex-col\">", "</div></div>"],
      _tmpl$4 = ["<option", " value=\"", "\">", "</option>"],
      _tmpl$5 = ["<div", " class=\"", "\">", "</div>"],
      _tmpl$6 = ["<input", " hidden type=\"radio\" name=\"", "\" id=\"", "\" value=\"", "\" aria-label=\"", "\"", ">"],
      _tmpl$7 = ["<div", " class=\"pb-4 space-y-6\"><!--#-->", "<!--/--><!--#-->", "<!--/--></div>"],
      _tmpl$8 = ["<div", " class=\"\"><select value=\"", "\" class=\"text-xs border rounded-sm p-1.5\" aria-label=\"Font weight\">", "</select></div>"],
      _tmpl$9 = ["<div", " class=\"\">", "</div>"],
      _tmpl$10 = ["<div", " class=\"text-xs text-gray-600 p-2\">", "</div>"],
      _tmpl$11 = ["<div", " class=\"w-[240px] max-w-[240px] min-w-[240px] border-l flex flex-col shrink-0\"><div class=\"flex p-1 space-x-2 items-center\"><button class=\"", "\" aria-label=\"Inspect element\"><span class=\"i-carbon:inspection w-5 h-5\"></span></button><button class=\"text-gray-900 font-semibold cursor-default text-xs\">Design</button></div><!--#-->", "<!--/--><div>", "</div></div>"],
      _tmpl$12 = ["<button", " class=\"", "\" aria-labelledby=\"", "\"><div class=\"i-radix-icons-text-align-left w-5 h-5\"></div></button>"],
      _tmpl$13 = ["<button", " class=\"", "\" aria-labelledby=\"", "\"><div class=\"i-radix-icons-text-align-center w-5 h-5\"></div></button>"],
      _tmpl$14 = ["<button", " class=\"", "\" aria-labelledby=\"", "\"><div class=\"i-radix-icons-text-align-right w-5 h-5\"></div></button>"],
      _tmpl$15 = ["<div", " class=\"text-xs text-gray-600 p-2\">Select an element.</div>"];

const fontWeightsMap = {
  Thin: "font-thin",
  "Extra Light": "font-extralight",
  Light: "font-light",
  Regular: "font-normal",
  Medium: "font-medium",
  "Semi Bold": "font-semibold",
  Bold: "font-bold",
  "Extra Bold": "font-extrabold",
  Black: "font-black"
};
const fontWeightsValues = Object.values(fontWeightsMap);
const textAlignsMap = {
  center: "text-center",
  left: "text-left",
  right: "text-right",
  justify: "text-justify"
};
const textAlignValues = Object.values(textAlignsMap);

const Panel = props => {
  return ssr(_tmpl$$5, ssrHydrationKey(), `flex flex-col border-t ${!!props.class ? escape(escape(props.class, true), true) : ""}`, escape(props.title), escape(props.children));
};
const ToggleGroup = props => {
  const [selected, setSelected] = createSignal(props.defaultValue);
  const id = `__toggle_group_` + createUniqueId();
  createEffect(() => {
    setSelected(props.value);
  });

  function set(v) {
    setSelected(v);
    props?.onInput(selected());
  }

  return ssr(_tmpl$5, ssrHydrationKey(), !!props.class ? escape(props.class, true) : "", escape(createComponent(For, {
    get each() {
      return props.options;
    },

    children: ({
      value,
      label,
      children
    }) => [children({
      value,
      label,
      id,
      selected: selected() === value,
      setSelected: set
    }), ssr(_tmpl$6, ssrHydrationKey(), escape(props.name, true) ?? escape(id, true), escape(id, true), escape(value, true), escape(label, true), ssrBoolean("checked", selected() === value))]
  })));
};
const SidePanel = () => {
  const {
    editorView
  } = useCodeMirror();
  const {
    setIsInspecting,
    isInspecting,
    selectedNode
  } = useControls();
  const {
    yText,
    ydoc
  } = useSync();
  const selectedClasses = createMemo(() => {
    if (!selectedNode()) {
      return null;
    }

    const classes = getClassNameValue(selectedNode())?.value ?? "";
    const classesSet = new Set();

    for (const className of classes.split(" ")) {
      if (className) {
        classesSet.add(className);
      }
    }

    const result = {
      classes,
      classesSet
    };
    return result;
  });

  function createMemoAttribute(values, fallback) {
    return createMemo(() => {
      if (!selectedClasses()) {
        return null;
      }

      const {
        classesSet
      } = selectedClasses();

      for (const value of values) {
        if (classesSet.has(value)) {
          return value;
        }
      }

      return fallback;
    });
  } // console.log(presetUno().rules);
  // function createMemoRule(rules: Rule[], fallback) {
  // }


  const fontWeight = createMemoAttribute(fontWeightsValues, "font-normal");
  const textAlign = createMemoAttribute(textAlignValues, "text-left");

  function directionSize(value) {
    return 0;
  }

  const margins = [[/^ma?()-?(-?.+)$/, directionSize()], [/^m-?xy()()$/, directionSize()], [/^m-?([xy])(?:-?(-?.+))?$/, directionSize()], [/^m-?([rltbse])(?:-?(-?.+))?$/, directionSize()], [/^m-(block|inline)(?:-(-?.+))?$/, directionSize()], [/^m-?([bi][se])(?:-?(-?.+))?$/, directionSize()]];
  createMemo(() => {
    if (!selectedClasses()) {
      return null;
    }

    const {
      classes
    } = selectedClasses();

    for (const [rule] of margins) {
      const match = rule.exec(classes);

      if (match) {
        // const n = /(\d+)/.exec(match[0])[0];
        // return n;
        return match[0];
      }
    }

    return "m-0";
  }); // createEffect(() => {
  //   console.log(margin());
  // });

  function setClassName(oldClassName, newClassName) {
    const hasExistingClassAttribute = selectedClasses().classesSet.size > 0;
    let absoluteStartIndex;

    if (hasExistingClassAttribute) {
      const classNameNode = findClassNameNode(selectedNode());
      const relativeStartIndex = selectedClasses().classes.indexOf(oldClassName);
      absoluteStartIndex = classNameNode.value.start + relativeStartIndex + 1;
      ydoc.transact(() => {
        if (selectedClasses().classesSet.has(oldClassName)) {
          yText.delete(absoluteStartIndex, oldClassName.length);
          yText.insert(absoluteStartIndex, newClassName);
        } else {
          absoluteStartIndex += 1;
          yText.insert(absoluteStartIndex, newClassName + " ");
        }
      });
    } else {
      const openingElement = selectedNode().openingElement;
      absoluteStartIndex = openingElement.name.end;
      yText.insert(absoluteStartIndex, ` className="${newClassName}"`);
      absoluteStartIndex = absoluteStartIndex + ` className="`.length;
      console.log("yes one");
    } // const highlightStart = selectedClasses().classes.indexOf(newClassName) + findClassNameNode


    editorView().dispatch({
      selection: EditorSelection.range(absoluteStartIndex, absoluteStartIndex + newClassName.length)
    });
  }

  function findClassNameNode(node) {
    for (const attribute of node.openingElement.attributes) {
      if (attribute.name.name === "className" || attribute.name.name === "class") {
        return attribute;
      }
    }

    return null;
  }

  function getClassNameValue(node) {
    return findClassNameNode(node)?.value;
  }

  return ssr(_tmpl$11, ssrHydrationKey(), `flex items-center p-1 cursor-default hover:ring-1 hover:ring-gray-200  hover:ring-offset-1 rounded-[0.5px] ${isInspecting() ? "text-gray-700 bg-gray-100" : ""} ${!isInspecting() ? "text-gray-500 active:bg-gray-100 active:text-gray-700" : ""}`, escape(createComponent(Show, {
    get when() {
      return selectedNode();
    },

    get children() {
      return [createComponent(Panel, {
        title: "Spacing",

        get children() {
          return ssr(_tmpl$7, ssrHydrationKey(), escape(createComponent(SpacingControl, {
            label: "Margin",
            onInput: s => {// setClassName(margin(), `m-${s.left}`);
            }
          })), escape(createComponent(SpacingControl, {
            label: "Padding"
          })));
        }

      }), createComponent(Panel, {
        title: "Text",
        "class": "flex flex-col",

        get children() {
          return [ssr(_tmpl$8, ssrHydrationKey(), escape(fontWeight(), true), escape(createComponent(For, {
            get each() {
              return Object.entries(fontWeightsMap);
            },

            children: ([label, fontWeight]) => ssr(_tmpl$4, ssrHydrationKey(), escape(fontWeight, true), escape(label))
          }))), ssr(_tmpl$9, ssrHydrationKey(), escape(createComponent(ToggleGroup, {
            defaultValue: "text-left",
            "class": "inline-flex mt-2 hover:ring-gray-200 hover:ring-1 ring-inset rounded-[3px]",

            get value() {
              return textAlign();
            },

            onInput: v => setClassName(textAlign(), v),
            options: [{
              value: "text-left",
              label: "Align left",
              children: ({
                id,
                value,
                selected,
                setSelected
              }) => ssr(_tmpl$12, ssrHydrationKey(), `flex p-0.5 cursor-default text-gray-700 border border-transparent rounded-sm ${selected ? "bg-gray-200 border-gray-200" : ""}`, escape(id, true))
            }, {
              value: "text-center",
              label: "Align center",
              children: ({
                id,
                value,
                selected,
                setSelected
              }) => ssr(_tmpl$13, ssrHydrationKey(), `flex p-0.5 cursor-default text-gray-700 border border-transparent rounded-sm ${selected ? "bg-gray-200 border-gray-200" : ""}`, escape(id, true))
            }, {
              value: "text-right",
              label: "Align right",
              children: ({
                id,
                value,
                selected,
                setSelected
              }) => ssr(_tmpl$14, ssrHydrationKey(), `flex p-0.5 cursor-default text-gray-700 border border-transparent rounded-sm ${selected ? "bg-gray-200 border-gray-200" : ""}`, escape(id, true))
            }]
          })))];
        }

      })];
    }

  })), escape(createComponent(Show, {
    get when() {
      return selectedClasses();
    },

    get fallback() {
      return ssr(_tmpl$15, ssrHydrationKey());
    },

    get children() {
      return ssr(_tmpl$10, ssrHydrationKey(), escape(selectedClasses().classes));
    }

  })));
};

const _tmpl$$4 = ["<div", " class=\"flex grow min-h-0\"><div class=\"", "\">", "</div><!--#-->", "<!--/--><!--#-->", "<!--/--></div>"];
const Repl = () => {
  const {
    yText,
    outputCss,
    outputJavascript,
    errors,
    ast
  } = useSync();
  const [position, setPosition] = createSignal();
  const {
    showRightPanel,
    showCode,
    setSelectedNode,
    inspectedElementPath
  } = useControls();

  function updateSelectedNode(position) {
    if (ast()) {
      const selectedNode = findJSXElement(ast(), position);
      setSelectedNode(selectedNode);
    }
  }

  createEffect(() => {
    if (inspectedElementPath().length && ast()) {
      const appPath = inspectedElementPath().slice(1);
      const selectedNode = findJSXElementFromPath(ast(), appPath);
      setSelectedNode(selectedNode);

      if (selectedNode) {
        editorView().dispatch({
          selection: EditorSelection.range(selectedNode.openingElement.start, selectedNode.openingElement.end)
        });
      }
    }
  });
  onMount(() => {
    yText.observe((e, transaction) => {
      updateSelectedNode(position());
    });
  });
  const {
    editorView
  } = useCodeMirror({
    updateListener: handleViewUpdate
  });

  function handleViewUpdate(v) {
    if (!v.selectionSet) {
      return;
    }

    const position = v.state.selection.ranges?.[0].from;
    console.log(position);
    setPosition(position);
    updateSelectedNode(position);
  }

  return ssr(_tmpl$$4, ssrHydrationKey(), `grow overflow-hidden ${!showCode() ? "hidden" : ""}`, escape(createComponent(CodeMirror, {})), escape(createComponent(Preview, {
    get scripts() {
      return outputJavascript();
    },

    get styles() {
      return outputCss();
    },

    get errors() {
      return errors();
    }

  })), escape(createComponent(Show, {
    get when() {
      return showRightPanel();
    },

    get children() {
      return createComponent(SidePanel, {});
    }

  })));
};

const _tmpl$$3 = ["<div", " class=\"flex flex-col h-full\">", "</div>"];
function ReplRoute() {
  const replId = useRouteData();
  return ssr(_tmpl$$3, ssrHydrationKey(), escape(createComponent(SyncProvider, {
    docId: replId,
    enableWebsocketProvider: true,

    get children() {
      return createComponent(ControlsProvider, {
        get children() {
          return createComponent(CodeMirrorProvider, {
            get children() {
              return [createComponent(Header, {
                replId: replId,
                showId: true
              }), createComponent(Repl, {})];
            }

          });
        }

      });
    }

  })));
}

var _replId_ = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  'default': ReplRoute
}, Symbol.toStringTag, { value: 'Module' }));

const _tmpl$$2 = ["<div", " class=\"flex flex-col h-full\">", "</div>"];
function Home() {
  const replId = useRouteData();
  return ssr(_tmpl$$2, ssrHydrationKey(), escape(createComponent(SyncProvider, {
    docId: replId,
    defaultValue: DEFAULT_CODE_2,

    get children() {
      return createComponent(ControlsProvider, {
        get children() {
          return createComponent(CodeMirrorProvider, {
            get children() {
              return [createComponent(Header, {
                replId: replId
              }), createComponent(Repl, {})];
            }

          });
        }

      });
    }

  })));
}

var index = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  'default': Home
}, Symbol.toStringTag, { value: 'Module' }));

const _tmpl$$1 = ["<div", "><textarea rows=\"20\" cols=\"40\" value=\"", "\"></textarea><button>compile</button></div>"];

const Swc = () => {
  const [initialized, setInitialized] = createSignal(false);
  const [code, setCode] = createSignal(DEFAULT_CODE_2);
  let swc;
  onMount(async () => {
    swc = await import('@swc/wasm-web');
    const initSwc = swc.default;
    await initSwc();
    setInitialized(true);
    console.log("Initialized swc!");
  });

  return ssr(_tmpl$$1, ssrHydrationKey(), escape(code(), true));
};

var swc = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  'default': Swc
}, Symbol.toStringTag, { value: 'Module' }));

const _tmpl$ = ["<div", ">hi</div>"],
      _tmpl$2 = ["<div", " class=\"p-10\"><button>ayo</button><!--#-->", "<!--/--></div>"];

const TestRoute = () => {
  const [show, setShow] = createSignal(true);
  return ssr(_tmpl$2, ssrHydrationKey(), escape(createComponent(Transition, {
    exitClass: "opacity-100",
    exitToClass: "opacity-0",
    exitActiveClass: "duration-200 transition",

    get children() {
      return createComponent(Show, {
        get when() {
          return show();
        },

        get children() {
          return ssr(_tmpl$, ssrHydrationKey());
        }

      });
    }

  })));
};

var test = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  'default': TestRoute
}, Symbol.toStringTag, { value: 'Module' }));

export { entryServer as default };
