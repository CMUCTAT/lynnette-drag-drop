
(function(l, r) { if (l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (window.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(window.document);
var app = (function () {
    'use strict';

    function noop() { }
    function assign(tar, src) {
        // @ts-ignore
        for (const k in src)
            tar[k] = src[k];
        return tar;
    }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    function validate_store(store, name) {
        if (store != null && typeof store.subscribe !== 'function') {
            throw new Error(`'${name}' is not a store with a 'subscribe' method`);
        }
    }
    function subscribe(store, ...callbacks) {
        if (store == null) {
            return noop;
        }
        const unsub = store.subscribe(...callbacks);
        return unsub.unsubscribe ? () => unsub.unsubscribe() : unsub;
    }
    function get_store_value(store) {
        let value;
        subscribe(store, _ => value = _)();
        return value;
    }
    function component_subscribe(component, store, callback) {
        component.$$.on_destroy.push(subscribe(store, callback));
    }
    function create_slot(definition, ctx, $$scope, fn) {
        if (definition) {
            const slot_ctx = get_slot_context(definition, ctx, $$scope, fn);
            return definition[0](slot_ctx);
        }
    }
    function get_slot_context(definition, ctx, $$scope, fn) {
        return definition[1] && fn
            ? assign($$scope.ctx.slice(), definition[1](fn(ctx)))
            : $$scope.ctx;
    }
    function get_slot_changes(definition, $$scope, dirty, fn) {
        if (definition[2] && fn) {
            const lets = definition[2](fn(dirty));
            if ($$scope.dirty === undefined) {
                return lets;
            }
            if (typeof lets === 'object') {
                const merged = [];
                const len = Math.max($$scope.dirty.length, lets.length);
                for (let i = 0; i < len; i += 1) {
                    merged[i] = $$scope.dirty[i] | lets[i];
                }
                return merged;
            }
            return $$scope.dirty | lets;
        }
        return $$scope.dirty;
    }
    function action_destroyer(action_result) {
        return action_result && is_function(action_result.destroy) ? action_result.destroy : noop;
    }

    const is_client = typeof window !== 'undefined';
    let now = is_client
        ? () => window.performance.now()
        : () => Date.now();
    let raf = is_client ? cb => requestAnimationFrame(cb) : noop;

    const tasks = new Set();
    function run_tasks(now) {
        tasks.forEach(task => {
            if (!task.c(now)) {
                tasks.delete(task);
                task.f();
            }
        });
        if (tasks.size !== 0)
            raf(run_tasks);
    }
    /**
     * Creates a new task that runs on each raf frame
     * until it returns a falsy value or is aborted
     */
    function loop(callback) {
        let task;
        if (tasks.size === 0)
            raf(run_tasks);
        return {
            promise: new Promise(fulfill => {
                tasks.add(task = { c: callback, f: fulfill });
            }),
            abort() {
                tasks.delete(task);
            }
        };
    }

    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function destroy_each(iterations, detaching) {
        for (let i = 0; i < iterations.length; i += 1) {
            if (iterations[i])
                iterations[i].d(detaching);
        }
    }
    function element(name) {
        return document.createElement(name);
    }
    function svg_element(name) {
        return document.createElementNS('http://www.w3.org/2000/svg', name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function empty() {
        return text('');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_style(node, key, value, important) {
        node.style.setProperty(key, value, important ? 'important' : '');
    }
    function toggle_class(element, name, toggle) {
        element.classList[toggle ? 'add' : 'remove'](name);
    }
    function custom_event(type, detail) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, false, false, detail);
        return e;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }
    function get_current_component() {
        if (!current_component)
            throw new Error(`Function called outside component initialization`);
        return current_component;
    }
    function beforeUpdate(fn) {
        get_current_component().$$.before_update.push(fn);
    }
    function onMount(fn) {
        get_current_component().$$.on_mount.push(fn);
    }
    function afterUpdate(fn) {
        get_current_component().$$.after_update.push(fn);
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    let flushing = false;
    const seen_callbacks = new Set();
    function flush() {
        if (flushing)
            return;
        flushing = true;
        do {
            // first, call beforeUpdate functions
            // and update components
            for (let i = 0; i < dirty_components.length; i += 1) {
                const component = dirty_components[i];
                set_current_component(component);
                update(component.$$);
            }
            dirty_components.length = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        flushing = false;
        seen_callbacks.clear();
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }
    const outroing = new Set();
    let outros;
    function group_outros() {
        outros = {
            r: 0,
            c: [],
            p: outros // parent group
        };
    }
    function check_outros() {
        if (!outros.r) {
            run_all(outros.c);
        }
        outros = outros.p;
    }
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
    }

    const globals = (typeof window !== 'undefined'
        ? window
        : typeof globalThis !== 'undefined'
            ? globalThis
            : global);
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        // onMount happens before the initial afterUpdate
        add_render_callback(() => {
            const new_on_destroy = on_mount.map(run).filter(is_function);
            if (on_destroy) {
                on_destroy.push(...new_on_destroy);
            }
            else {
                // Edge case - component was destroyed immediately,
                // most likely as a result of a binding initialising
                run_all(new_on_destroy);
            }
            component.$$.on_mount = [];
        });
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const prop_values = options.props || {};
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            before_update: [],
            after_update: [],
            context: new Map(parent_component ? parent_component.$$.context : []),
            // everything else
            callbacks: blank_object(),
            dirty
        };
        let ready = false;
        $$.ctx = instance
            ? instance(component, prop_values, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if ($$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor);
            flush();
        }
        set_current_component(parent_component);
    }
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set() {
            // overridden by instance, if it has props
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.21.0' }, detail)));
    }
    function append_dev(target, node) {
        dispatch_dev("SvelteDOMInsert", { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev("SvelteDOMInsert", { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev("SvelteDOMRemove", { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ["capture"] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev("SvelteDOMAddEventListener", { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev("SvelteDOMRemoveEventListener", { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev("SvelteDOMRemoveAttribute", { node, attribute });
        else
            dispatch_dev("SvelteDOMSetAttribute", { node, attribute, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.data === data)
            return;
        dispatch_dev("SvelteDOMSetData", { node: text, data });
        text.data = data;
    }
    function validate_each_argument(arg) {
        if (typeof arg !== 'string' && !(arg && typeof arg === 'object' && 'length' in arg)) {
            let msg = '{#each} only iterates over array-like objects.';
            if (typeof Symbol === 'function' && arg && Symbol.iterator in arg) {
                msg += ' You can use a spread to convert this iterable into an array.';
            }
            throw new Error(msg);
        }
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error(`'target' is a required option`);
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn(`Component was already destroyed`); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    const generateID = () => Math.random().toString(36).substr(2, 9);

    class EquationNode {
      constructor(parent, path) {
        this.parent = parent;
        this.path = path;
        this.id = generateID();
      }
    }

    class Equation extends EquationNode {
      constructor(left, right) {
        super(null, null);
        this.left = left;
        this.right = right;
      }

      stringify() {
        return this.left.stringify() + " = " + this.right.stringify();
      }
    }

    class Token extends EquationNode {
      constructor(parent, path, constant, variable, ...indices) {
        super(parent, path);
        this.constant = constant;
        this.variable = variable;
        this.indices = indices;
      }
      stringify() {
        return this.value();
      }
      value() {
        const constant = !(this.variable && this.constant === 1)
          ? this.constant === -1
            ? "-"
            : this.constant
          : "";
        const variable = this.variable || "";
        return constant + variable;
      }
    }

    class UnknownToken extends Token {
      constructor(parent, path, startIndex = null) {
        super(parent, path, null, null, startIndex, null);
        this.unknown = true;
      }
    }

    class Expression extends EquationNode {
      constructor(parent, path, nodes, parens = false) {
        super(parent, path);
        this.nodes = nodes;
        this.parens = parens;
      }
      stringify() {
        return "(" + this.nodes.map((item) => item.stringify()).join(" ") + ")";
      }
    }

    const Operations = { PLUS: "+", MINUS: "-", TIMES: "×", DIVIDE: "÷" };
    class Operator extends EquationNode {
      constructor(parent, path, symbol, operation) {
        super(parent, path);
        this.symbol = symbol;
        this.operation = operation;
      }
      equals(other) {
        return typeof other === "string" || other instanceof String
          ? this.symbol === other
          : other instanceof Operator && other.symbol === this.symbol;
      }
      stringify() {
        return this.symbol;
      }
    }

    class PlusOperator extends Operator {
      constructor(parent, path) {
        super(parent, path, Operations.PLUS, "PLUS");
      }
    }

    class MinusOperator extends Operator {
      constructor(parent, path) {
        super(parent, path, Operations.MINUS, "MINUS");
      }
    }

    class TimesOperator extends Operator {
      constructor(parent, path) {
        super(parent, path, Operations.TIMES, "TIMES");
      }
    }

    class DivideOperator extends Operator {
      constructor(parent, path) {
        super(parent, path, Operations.DIVIDE, "DIVIDE");
      }
    }

    function flattenPath(path) {
      return path.join(",").split(",");
    }

    /**
     * Transforms algebra grammar tree from CTATAlgebraParser into EquationNode interpretable by the interface
     * @export
     * @param {CTATAlgebraNode} expression grammar to transform into an EquationNode
     * @param {EquationNode} [parent=null] the parent of the passed in node; will be automatically set recursively
     * @param {int} [parentIndex=null] the index of the passed in node relative to its parent
     * @param {bool} [ignoreSign=false] should constants take the sign of their expression; only used when constructing PLUS operations with minuses to properly display numbers as e.g. 1 - 2 not 1 + -2
     * @returns EquationNode transformed tree
     */
    function parseGrammar(expression, parent = null, parentIndex = null, ignoreSign = false) {
      //return different things depending on what the node's operator is
      if (expression.operator === "EQUAL") {
        let operands = parse.algGetOperands(expression);
        let eqn = new Equation(null); //null equation has to be made first to pass it in as a parent
        eqn.left = parseGrammar(operands[0], eqn);
        eqn.right = parseGrammar(operands[1], eqn);
        return eqn;
      } else if (expression.operator === "CONST") {
        return new Token(
          parent,
          flattenPath(expression.path),
          (ignoreSign ? 1 : expression.sign) * expression.value,
          null,
          parentIndex
        );
      } else if (expression.operator === "VAR") {
        return new Token(
          parent,
          flattenPath(expression.path),
          expression.sign,
          expression.variable,
          parentIndex
        );
      } else if (expression.operator === "UMINUS") {
        return new Token(
          parent,
          flattenPath(expression.path),
          -expression.base.value,
          null,
          parentIndex
        );
      } else if (expression.operator === "UNKNOWN") {
        return new UnknownToken(parent, flattenPath(expression.path), parentIndex);
      } else if (expression.operator === "PLUS") {
        let operands = parse.algGetOperands(expression);
        let exp = new Expression(parent, flattenPath(expression.path), [], expression.parens > 0);
        exp.nodes = operands.reduce((acc, e, i) => {
          let node = parseGrammar(e, exp, i, i > 0);
          return i > 0
            ? acc.concat(
                e.sign > 0
                  ? new PlusOperator(parent, flattenPath(expression.path))
                  : new MinusOperator(parent, flattenPath(expression.path)),
                node
              )
            : acc.concat(node);
        }, []);
        return exp;
      } else if (expression.operator === "TIMES") {
        let operands = parse.algGetOperands(expression);
        let nodes = operands.reduce((acc, e, i) => {
          //parse nodes, but remember their exponent so we can sort it into top or bottom
          let node = parseGrammar(e, null, i); //these nodes won't have a parent yet; it'll be set later once we determine which expression it's the child of
          return acc.concat({ exp: e.exp, node });
        }, []);
        let topNodes = [];
        let bottomNodes = [];
        nodes.forEach((e) => {
          //sort nodes into top or bottom exponent^1 is on top exponent^-1 is on bottom
          if (e.exp >= 0) {
            topNodes.push(e.node);
          } else {
            bottomNodes.push(e.node);
          }
        });
        if (bottomNodes.length > 0) {
          //if there are bottom nodes then create division expression with top and bottom nodes in their respective places
          let exp = new Expression(parent, flattenPath(expression.path), [], expression.parens > 0);
          exp.nodes = [
            combineConstVars(topNodes, exp, flattenPath(expression.path)),
            new DivideOperator(parent, flattenPath(expression.path)),
            combineConstVars(bottomNodes, exp, flattenPath(expression.path)),
          ];
          return exp;
        } else {
          //if there aren't any bottom nodes, then create a multiplication expression
          return combineConstVars(topNodes, parent, flattenPath(expression.path));
        }
      } else {
        //this shouldn't happen, but nulls are just ignored by the interface renderer
        return null;
      }
    }

    /**
     * Given a list of nodes, combine neigbor constants and variables into single tokens and returns the resulting nodes as a single expression
     * NOTE: this should only be called on lists of nodes in TIMES expressions
     * @param {array of EquationNode} nodes nodes which will be combined
     * @param {EquationNode} parent parent of the passed in nodes
     * @returns EquationNode expression of combined nodes
     */
    function combineConstVars(nodes, parent, path) {
      if (nodes.length === 1) {
        //if there's only one node, then set the parent of that node to the original parent, then return it alone
        nodes[0].parent = parent;
        return nodes[0];
      }
      let exp = new Expression(parent, path, []);
      for (let i = 0; i < nodes.length; i++) {
        if (i === nodes.length - 1) {
          //if we're at the last node, just add it to the expression
          nodes[i].parent = exp;
          exp.nodes.push(nodes[i]);
        } else if (
          nodes[i] instanceof Token &&
          nodes[i].constant &&
          nodes[i + 1] instanceof Token &&
          nodes[i + 1].variable
        ) {
          //if the current node is a constant and the next a variable, combine them into a single token and add it to the expression
          exp.nodes.push(
            new Token(
              exp,
              path,
              nodes[i].constant,
              nodes[i + 1].variable,
              nodes[i].startIndex,
              nodes[i + 1].stopIndex
            )
          );
          i++;
        } else {
          //otherwise, add the node and a times operator
          nodes[i].parent = exp;
          exp.nodes.push(nodes[i]);
          exp.nodes.push(new TimesOperator(parent, path));
        }
      }
      if (exp.nodes.length === 1) {
        //if, after combining, there's only one element, then ignore the new expression, set that node's parent to the original parent and return it
        exp.nodes[0].parent = parent;
        return exp.nodes[0];
      }
      return exp;
    }

    const subscriber_queue = [];
    /**
     * Create a `Writable` store that allows both updating and reading by subscription.
     * @param {*=}value initial value
     * @param {StartStopNotifier=}start start and stop notifications for subscriptions
     */
    function writable(value, start = noop) {
        let stop;
        const subscribers = [];
        function set(new_value) {
            if (safe_not_equal(value, new_value)) {
                value = new_value;
                if (stop) { // store is ready
                    const run_queue = !subscriber_queue.length;
                    for (let i = 0; i < subscribers.length; i += 1) {
                        const s = subscribers[i];
                        s[1]();
                        subscriber_queue.push(s, value);
                    }
                    if (run_queue) {
                        for (let i = 0; i < subscriber_queue.length; i += 2) {
                            subscriber_queue[i][0](subscriber_queue[i + 1]);
                        }
                        subscriber_queue.length = 0;
                    }
                }
            }
        }
        function update(fn) {
            set(fn(value));
        }
        function subscribe(run, invalidate = noop) {
            const subscriber = [run, invalidate];
            subscribers.push(subscriber);
            if (subscribers.length === 1) {
                stop = start(set) || noop;
            }
            run(value);
            return () => {
                const index = subscribers.indexOf(subscriber);
                if (index !== -1) {
                    subscribers.splice(index, 1);
                }
                if (subscribers.length === 0) {
                    stop();
                    stop = null;
                }
            };
        }
        return { set, update, subscribe };
    }

    // Should be no imports here!
    var _a; // SOme things that should be evaluated before all else...


    var hasSymbol = typeof Symbol !== "undefined";
    var hasMap = typeof Map !== "undefined";
    var hasSet = typeof Set !== "undefined";
    /**
     * The sentinel value returned by producers to replace the draft with undefined.
     */

    var NOTHING = hasSymbol ? Symbol("immer-nothing") : (_a = {}, _a["immer-nothing"] = true, _a);
    /**
     * To let Immer treat your class instances as plain immutable objects
     * (albeit with a custom prototype), you must define either an instance property
     * or a static property on each of your custom classes.
     *
     * Otherwise, your class instance will never be drafted, which means it won't be
     * safe to mutate in a produce callback.
     */

    var DRAFTABLE = hasSymbol ? Symbol("immer-draftable") : "__$immer_draftable";
    var DRAFT_STATE = hasSymbol ? Symbol("immer-state") : "__$immer_state";
    var iteratorSymbol = hasSymbol ? Symbol.iterator : "@@iterator";

    /* istanbul ignore next */
    var extendStatics = function (d, b) {
      extendStatics = Object.setPrototypeOf || {
        __proto__: []
      } instanceof Array && function (d, b) {
        d.__proto__ = b;
      } || function (d, b) {
        for (var p in b) { if (b.hasOwnProperty(p)) { d[p] = b[p]; } }
      };

      return extendStatics(d, b);
    }; // Ugly hack to resolve #502 and inherit built in Map / Set


    function __extends(d, b) {
      extendStatics(d, b);

      function __() {
        this.constructor = d;
      }

      d.prototype = ( // @ts-ignore
      __.prototype = b.prototype, new __());
    }

    var Archtype;

    (function (Archtype) {
      Archtype[Archtype["Object"] = 0] = "Object";
      Archtype[Archtype["Array"] = 1] = "Array";
      Archtype[Archtype["Map"] = 2] = "Map";
      Archtype[Archtype["Set"] = 3] = "Set";
    })(Archtype || (Archtype = {}));

    var ProxyType;

    (function (ProxyType) {
      ProxyType[ProxyType["ProxyObject"] = 0] = "ProxyObject";
      ProxyType[ProxyType["ProxyArray"] = 1] = "ProxyArray";
      ProxyType[ProxyType["ES5Object"] = 2] = "ES5Object";
      ProxyType[ProxyType["ES5Array"] = 3] = "ES5Array";
      ProxyType[ProxyType["Map"] = 4] = "Map";
      ProxyType[ProxyType["Set"] = 5] = "Set";
    })(ProxyType || (ProxyType = {}));

    /** Returns true if the given value is an Immer draft */

    function isDraft(value) {
      return !!value && !!value[DRAFT_STATE];
    }
    /** Returns true if the given value can be drafted by Immer */

    function isDraftable(value) {
      if (!value) { return false; }
      return isPlainObject(value) || Array.isArray(value) || !!value[DRAFTABLE] || !!value.constructor[DRAFTABLE] || isMap(value) || isSet(value);
    }
    function isPlainObject(value) {
      if (!value || typeof value !== "object") { return false; }
      var proto = Object.getPrototypeOf(value);
      return !proto || proto === Object.prototype;
    }
    var ownKeys = typeof Reflect !== "undefined" && Reflect.ownKeys ? Reflect.ownKeys : typeof Object.getOwnPropertySymbols !== "undefined" ? function (obj) {
      return Object.getOwnPropertyNames(obj).concat(Object.getOwnPropertySymbols(obj));
    } :
    /* istanbul ignore next */
    Object.getOwnPropertyNames;
    function each(obj, iter) {
      if (getArchtype(obj) === Archtype.Object) {
        ownKeys(obj).forEach(function (key) {
          return iter(key, obj[key], obj);
        });
      } else {
        obj.forEach(function (entry, index) {
          return iter(index, entry, obj);
        });
      }
    }
    function isEnumerable(base, prop) {
      var desc = Object.getOwnPropertyDescriptor(base, prop);
      return desc && desc.enumerable ? true : false;
    }
    function getArchtype(thing) {
      /* istanbul ignore next */
      if (!thing) { die(); }

      if (thing[DRAFT_STATE]) {
        switch (thing[DRAFT_STATE].type) {
          case ProxyType.ES5Object:
          case ProxyType.ProxyObject:
            return Archtype.Object;

          case ProxyType.ES5Array:
          case ProxyType.ProxyArray:
            return Archtype.Array;

          case ProxyType.Map:
            return Archtype.Map;

          case ProxyType.Set:
            return Archtype.Set;
        }
      }

      return Array.isArray(thing) ? Archtype.Array : isMap(thing) ? Archtype.Map : isSet(thing) ? Archtype.Set : Archtype.Object;
    }
    function has(thing, prop) {
      return getArchtype(thing) === Archtype.Map ? thing.has(prop) : Object.prototype.hasOwnProperty.call(thing, prop);
    }
    function get(thing, prop) {
      // @ts-ignore
      return getArchtype(thing) === Archtype.Map ? thing.get(prop) : thing[prop];
    }
    function set(thing, propOrOldValue, value) {
      switch (getArchtype(thing)) {
        case Archtype.Map:
          thing.set(propOrOldValue, value);
          break;

        case Archtype.Set:
          thing.delete(propOrOldValue);
          thing.add(value);
          break;

        default:
          thing[propOrOldValue] = value;
      }
    }
    function is(x, y) {
      // From: https://github.com/facebook/fbjs/blob/c69904a511b900266935168223063dd8772dfc40/packages/fbjs/src/core/shallowEqual.js
      if (x === y) {
        return x !== 0 || 1 / x === 1 / y;
      } else {
        return x !== x && y !== y;
      }
    }
    function isMap(target) {
      return hasMap && target instanceof Map;
    }
    function isSet(target) {
      return hasSet && target instanceof Set;
    }
    function latest(state) {
      return state.copy || state.base;
    }
    function shallowCopy(base, invokeGetters) {
      if (invokeGetters === void 0) {
        invokeGetters = false;
      }

      if (Array.isArray(base)) { return base.slice(); }
      var clone = Object.create(Object.getPrototypeOf(base));
      ownKeys(base).forEach(function (key) {
        if (key === DRAFT_STATE) {
          return; // Never copy over draft state.
        }

        var desc = Object.getOwnPropertyDescriptor(base, key);
        var value = desc.value;

        if (desc.get) {
          if (!invokeGetters) {
            throw new Error("Immer drafts cannot have computed properties");
          }

          value = desc.get.call(base);
        }

        if (desc.enumerable) {
          clone[key] = value;
        } else {
          Object.defineProperty(clone, key, {
            value: value,
            writable: true,
            configurable: true
          });
        }
      });
      return clone;
    }
    function freeze(obj, deep) {
      if (!isDraftable(obj) || isDraft(obj) || Object.isFrozen(obj)) { return; }
      var type = getArchtype(obj);

      if (type === Archtype.Set) {
        obj.add = obj.clear = obj.delete = dontMutateFrozenCollections;
      } else if (type === Archtype.Map) {
        obj.set = obj.clear = obj.delete = dontMutateFrozenCollections;
      }

      Object.freeze(obj);
      if (deep) { each(obj, function (_, value) {
        return freeze(value, true);
      }); }
    }

    function dontMutateFrozenCollections() {
      throw new Error("This object has been frozen and should not be mutated");
    }

    function createHiddenProperty(target, prop, value) {
      Object.defineProperty(target, prop, {
        value: value,
        enumerable: false,
        writable: true
      });
    }
    /* istanbul ignore next */

    function die() {
      throw new Error("Illegal state, please file a bug");
    }

    /** Each scope represents a `produce` call. */

    var ImmerScope =
    /** @class */
    function () {
      function ImmerScope(parent, immer) {
        this.drafts = [];
        this.parent = parent;
        this.immer = immer; // Whenever the modified draft contains a draft from another scope, we
        // need to prevent auto-freezing so the unowned draft can be finalized.

        this.canAutoFreeze = true;
      }

      ImmerScope.prototype.usePatches = function (patchListener) {
        if (patchListener) {
          this.patches = [];
          this.inversePatches = [];
          this.patchListener = patchListener;
        }
      };

      ImmerScope.prototype.revoke = function () {
        this.leave();
        this.drafts.forEach(revoke); // @ts-ignore

        this.drafts = null;
      };

      ImmerScope.prototype.leave = function () {
        if (this === ImmerScope.current) {
          ImmerScope.current = this.parent;
        }
      };

      ImmerScope.enter = function (immer) {
        var scope = new ImmerScope(ImmerScope.current, immer);
        ImmerScope.current = scope;
        return scope;
      };

      return ImmerScope;
    }();

    function revoke(draft) {
      var state = draft[DRAFT_STATE];
      if (state.type === ProxyType.ProxyObject || state.type === ProxyType.ProxyArray) { state.revoke(); }else { state.revoked = true; }
    }

    function processResult(immer, result, scope) {
      var baseDraft = scope.drafts[0];
      var isReplaced = result !== undefined && result !== baseDraft;
      immer.willFinalize(scope, result, isReplaced);

      if (isReplaced) {
        if (baseDraft[DRAFT_STATE].modified) {
          scope.revoke();
          throw new Error("An immer producer returned a new value *and* modified its draft. Either return a new value *or* modify the draft."); // prettier-ignore
        }

        if (isDraftable(result)) {
          // Finalize the result in case it contains (or is) a subset of the draft.
          result = finalize(immer, result, scope);
          if (!scope.parent) { maybeFreeze(immer, result); }
        }

        if (scope.patches) {
          scope.patches.push({
            op: "replace",
            path: [],
            value: result
          });
          scope.inversePatches.push({
            op: "replace",
            path: [],
            value: baseDraft[DRAFT_STATE].base
          });
        }
      } else {
        // Finalize the base draft.
        result = finalize(immer, baseDraft, scope, []);
      }

      scope.revoke();

      if (scope.patches) {
        scope.patchListener(scope.patches, scope.inversePatches);
      }

      return result !== NOTHING ? result : undefined;
    }

    function finalize(immer, draft, scope, path) {
      var state = draft[DRAFT_STATE];

      if (!state) {
        if (Object.isFrozen(draft)) { return draft; }
        return finalizeTree(immer, draft, scope);
      } // Never finalize drafts owned by another scope.


      if (state.scope !== scope) {
        return draft;
      }

      if (!state.modified) {
        maybeFreeze(immer, state.base, true);
        return state.base;
      }

      if (!state.finalized) {
        state.finalized = true;
        finalizeTree(immer, state.draft, scope, path); // We cannot really delete anything inside of a Set. We can only replace the whole Set.

        if (immer.onDelete && state.type !== ProxyType.Set) {
          // The `assigned` object is unreliable with ES5 drafts.
          if (immer.useProxies) {
            var assigned = state.assigned;
            each(assigned, function (prop, exists) {
              if (!exists) { immer.onDelete(state, prop); }
            });
          } else {
            var base = state.base,
                copy_1 = state.copy;
            each(base, function (prop) {
              if (!has(copy_1, prop)) { immer.onDelete(state, prop); }
            });
          }
        }

        if (immer.onCopy) {
          immer.onCopy(state);
        } // At this point, all descendants of `state.copy` have been finalized,
        // so we can be sure that `scope.canAutoFreeze` is accurate.


        if (immer.autoFreeze && scope.canAutoFreeze) {
          freeze(state.copy, false);
        }

        if (path && scope.patches) {
          generatePatches(state, path, scope.patches, scope.inversePatches);
        }
      }

      return state.copy;
    }

    function finalizeTree(immer, root, scope, rootPath) {
      var state = root[DRAFT_STATE];

      if (state) {
        if (state.type === ProxyType.ES5Object || state.type === ProxyType.ES5Array) {
          // Create the final copy, with added keys and without deleted keys.
          state.copy = shallowCopy(state.draft, true);
        }

        root = state.copy;
      }

      each(root, function (key, value) {
        return finalizeProperty(immer, scope, root, state, root, key, value, rootPath);
      });
      return root;
    }

    function finalizeProperty(immer, scope, root, rootState, parentValue, prop, childValue, rootPath) {
      if (childValue === parentValue) {
        throw Error("Immer forbids circular references");
      } // In the `finalizeTree` method, only the `root` object may be a draft.


      var isDraftProp = !!rootState && parentValue === root;
      var isSetMember = isSet(parentValue);

      if (isDraft(childValue)) {
        var path = rootPath && isDraftProp && !isSetMember && // Set objects are atomic since they have no keys.
        !has(rootState.assigned, prop) // Skip deep patches for assigned keys.
        ? rootPath.concat(prop) : undefined; // Drafts owned by `scope` are finalized here.

        childValue = finalize(immer, childValue, scope, path);
        set(parentValue, prop, childValue); // Drafts from another scope must prevent auto-freezing.

        if (isDraft(childValue)) {
          scope.canAutoFreeze = false;
        }
      } // Unchanged draft properties are ignored.
      else if (isDraftProp && is(childValue, get(rootState.base, prop))) {
          return;
        } // Search new objects for unfinalized drafts. Frozen objects should never contain drafts.
        // TODO: the recursion over here looks weird, shouldn't non-draft stuff have it's own recursion?
        // especially the passing on of root and rootState doesn't make sense...
        else if (isDraftable(childValue)) {
            each(childValue, function (key, grandChild) {
              return finalizeProperty(immer, scope, root, rootState, childValue, key, grandChild, rootPath);
            });
            if (!scope.parent) { maybeFreeze(immer, childValue); }
          }

      if (isDraftProp && immer.onAssign && !isSetMember) {
        immer.onAssign(rootState, prop, childValue);
      }
    }

    function maybeFreeze(immer, value, deep) {
      if (deep === void 0) {
        deep = false;
      }

      if (immer.autoFreeze && !isDraft(value)) {
        freeze(value, deep);
      }
    }

    /**
     * Returns a new draft of the `base` object.
     *
     * The second argument is the parent draft-state (used internally).
     */

    function createProxy(base, parent) {
      var isArray = Array.isArray(base);
      var state = {
        type: isArray ? ProxyType.ProxyArray : ProxyType.ProxyObject,
        // Track which produce call this is associated with.
        scope: parent ? parent.scope : ImmerScope.current,
        // True for both shallow and deep changes.
        modified: false,
        // Used during finalization.
        finalized: false,
        // Track which properties have been assigned (true) or deleted (false).
        assigned: {},
        // The parent draft state.
        parent: parent,
        // The base state.
        base: base,
        // The base proxy.
        draft: null,
        // Any property proxies.
        drafts: {},
        // The base copy with any updated values.
        copy: null,
        // Called by the `produce` function.
        revoke: null,
        isManual: false
      }; // the traps must target something, a bit like the 'real' base.
      // but also, we need to be able to determine from the target what the relevant state is
      // (to avoid creating traps per instance to capture the state in closure,
      // and to avoid creating weird hidden properties as well)
      // So the trick is to use 'state' as the actual 'target'! (and make sure we intercept everything)
      // Note that in the case of an array, we put the state in an array to have better Reflect defaults ootb

      var target = state;
      var traps = objectTraps;

      if (isArray) {
        target = [state];
        traps = arrayTraps;
      } // TODO: optimization: might be faster, cheaper if we created a non-revocable proxy
      // and administrate revoking ourselves


      var _a = Proxy.revocable(target, traps),
          revoke = _a.revoke,
          proxy = _a.proxy;

      state.draft = proxy;
      state.revoke = revoke;
      return proxy;
    }
    /**
     * Object drafts
     */

    var objectTraps = {
      get: function (state, prop) {
        if (prop === DRAFT_STATE) { return state; }
        var drafts = state.drafts; // Check for existing draft in unmodified state.

        if (!state.modified && has(drafts, prop)) {
          return drafts[prop];
        }

        var value = latest(state)[prop];

        if (state.finalized || !isDraftable(value)) {
          return value;
        } // Check for existing draft in modified state.


        if (state.modified) {
          // Assigned values are never drafted. This catches any drafts we created, too.
          if (value !== peek(state.base, prop)) { return value; } // Store drafts on the copy (when one exists).
          // @ts-ignore

          drafts = state.copy;
        }

        return drafts[prop] = state.scope.immer.createProxy(value, state);
      },
      has: function (state, prop) {
        return prop in latest(state);
      },
      ownKeys: function (state) {
        return Reflect.ownKeys(latest(state));
      },
      set: function (state, prop
      /* strictly not, but helps TS */
      , value) {
        if (!state.modified) {
          var baseValue = peek(state.base, prop); // Optimize based on value's truthiness. Truthy values are guaranteed to
          // never be undefined, so we can avoid the `in` operator. Lastly, truthy
          // values may be drafts, but falsy values are never drafts.

          var isUnchanged = value ? is(baseValue, value) || value === state.drafts[prop] : is(baseValue, value) && prop in state.base;
          if (isUnchanged) { return true; }
          prepareCopy(state);
          markChanged(state);
        }

        state.assigned[prop] = true; // @ts-ignore

        state.copy[prop] = value;
        return true;
      },
      deleteProperty: function (state, prop) {
        // The `undefined` check is a fast path for pre-existing keys.
        if (peek(state.base, prop) !== undefined || prop in state.base) {
          state.assigned[prop] = false;
          prepareCopy(state);
          markChanged(state);
        } else if (state.assigned[prop]) {
          // if an originally not assigned property was deleted
          delete state.assigned[prop];
        } // @ts-ignore


        if (state.copy) { delete state.copy[prop]; }
        return true;
      },
      // Note: We never coerce `desc.value` into an Immer draft, because we can't make
      // the same guarantee in ES5 mode.
      getOwnPropertyDescriptor: function (state, prop) {
        var owner = latest(state);
        var desc = Reflect.getOwnPropertyDescriptor(owner, prop);

        if (desc) {
          desc.writable = true;
          desc.configurable = state.type !== ProxyType.ProxyArray || prop !== "length";
        }

        return desc;
      },
      defineProperty: function () {
        throw new Error("Object.defineProperty() cannot be used on an Immer draft"); // prettier-ignore
      },
      getPrototypeOf: function (state) {
        return Object.getPrototypeOf(state.base);
      },
      setPrototypeOf: function () {
        throw new Error("Object.setPrototypeOf() cannot be used on an Immer draft"); // prettier-ignore
      }
    };
    /**
     * Array drafts
     */

    var arrayTraps = {};
    each(objectTraps, function (key, fn) {
      // @ts-ignore
      arrayTraps[key] = function () {
        arguments[0] = arguments[0][0];
        return fn.apply(this, arguments);
      };
    });

    arrayTraps.deleteProperty = function (state, prop) {
      if (isNaN(parseInt(prop))) {
        throw new Error("Immer only supports deleting array indices"); // prettier-ignore
      }

      return objectTraps.deleteProperty.call(this, state[0], prop);
    };

    arrayTraps.set = function (state, prop, value) {
      if (prop !== "length" && isNaN(parseInt(prop))) {
        throw new Error("Immer only supports setting array indices and the 'length' property"); // prettier-ignore
      }

      return objectTraps.set.call(this, state[0], prop, value, state[0]);
    };
    /**
     * Map drafts
     */
    // Access a property without creating an Immer draft.


    function peek(draft, prop) {
      var state = draft[DRAFT_STATE];
      var desc = Reflect.getOwnPropertyDescriptor(state ? latest(state) : draft, prop);
      return desc && desc.value;
    }

    function markChanged(state) {
      if (!state.modified) {
        state.modified = true;

        if (state.type === ProxyType.ProxyObject || state.type === ProxyType.ProxyArray) {
          var copy_1 = state.copy = shallowCopy(state.base);
          each(state.drafts, function (key, value) {
            // @ts-ignore
            copy_1[key] = value;
          });
          state.drafts = undefined;
        }

        if (state.parent) {
          markChanged(state.parent);
        }
      }
    }

    function prepareCopy(state) {
      if (!state.copy) {
        state.copy = shallowCopy(state.base);
      }
    }

    function willFinalizeES5(scope, result, isReplaced) {
      scope.drafts.forEach(function (draft) {
        draft[DRAFT_STATE].finalizing = true;
      });

      if (!isReplaced) {
        if (scope.patches) {
          markChangesRecursively(scope.drafts[0]);
        } // This is faster when we don't care about which attributes changed.


        markChangesSweep(scope.drafts);
      } // When a child draft is returned, look for changes.
      else if (isDraft(result) && result[DRAFT_STATE].scope === scope) {
          markChangesSweep(scope.drafts);
        }
    }
    function createES5Proxy(base, parent) {
      var isArray = Array.isArray(base);
      var draft = clonePotentialDraft(base);
      each(draft, function (prop) {
        proxyProperty(draft, prop, isArray || isEnumerable(base, prop));
      });
      var state = {
        type: isArray ? ProxyType.ES5Array : ProxyType.ES5Object,
        scope: parent ? parent.scope : ImmerScope.current,
        modified: false,
        finalizing: false,
        finalized: false,
        assigned: {},
        parent: parent,
        base: base,
        draft: draft,
        copy: null,
        revoked: false,
        isManual: false
      };
      createHiddenProperty(draft, DRAFT_STATE, state);
      return draft;
    } // Access a property without creating an Immer draft.

    function peek$1(draft, prop) {
      var state = draft[DRAFT_STATE];

      if (state && !state.finalizing) {
        state.finalizing = true;
        var value = draft[prop];
        state.finalizing = false;
        return value;
      }

      return draft[prop];
    }

    function get$1(state, prop) {
      assertUnrevoked(state);
      var value = peek$1(latest(state), prop);
      if (state.finalizing) { return value; } // Create a draft if the value is unmodified.

      if (value === peek$1(state.base, prop) && isDraftable(value)) {
        prepareCopy$1(state); // @ts-ignore

        return state.copy[prop] = state.scope.immer.createProxy(value, state);
      }

      return value;
    }

    function set$1(state, prop, value) {
      assertUnrevoked(state);
      state.assigned[prop] = true;

      if (!state.modified) {
        if (is(value, peek$1(latest(state), prop))) { return; }
        markChangedES5(state);
        prepareCopy$1(state);
      } // @ts-ignore


      state.copy[prop] = value;
    }

    function markChangedES5(state) {
      if (!state.modified) {
        state.modified = true;
        if (state.parent) { markChangedES5(state.parent); }
      }
    }

    function prepareCopy$1(state) {
      if (!state.copy) { state.copy = clonePotentialDraft(state.base); }
    }

    function clonePotentialDraft(base) {
      var state = base && base[DRAFT_STATE];

      if (state) {
        state.finalizing = true;
        var draft = shallowCopy(state.draft, true);
        state.finalizing = false;
        return draft;
      }

      return shallowCopy(base);
    } // property descriptors are recycled to make sure we don't create a get and set closure per property,
    // but share them all instead


    var descriptors = {};

    function proxyProperty(draft, prop, enumerable) {
      var desc = descriptors[prop];

      if (desc) {
        desc.enumerable = enumerable;
      } else {
        descriptors[prop] = desc = {
          configurable: true,
          enumerable: enumerable,
          get: function () {
            return get$1(this[DRAFT_STATE], prop);
          },
          set: function (value) {
            set$1(this[DRAFT_STATE], prop, value);
          }
        };
      }

      Object.defineProperty(draft, prop, desc);
    }

    function assertUnrevoked(state) {
      if (state.revoked === true) { throw new Error("Cannot use a proxy that has been revoked. Did you pass an object from inside an immer function to an async process? " + JSON.stringify(latest(state))); }
    } // This looks expensive, but only proxies are visited, and only objects without known changes are scanned.

    function markChangesSweep(drafts) {
      // The natural order of drafts in the `scope` array is based on when they
      // were accessed. By processing drafts in reverse natural order, we have a
      // better chance of processing leaf nodes first. When a leaf node is known to
      // have changed, we can avoid any traversal of its ancestor nodes.
      for (var i = drafts.length - 1; i >= 0; i--) {
        var state = drafts[i][DRAFT_STATE];

        if (!state.modified) {
          switch (state.type) {
            case ProxyType.ES5Array:
              if (hasArrayChanges(state)) { markChangedES5(state); }
              break;

            case ProxyType.ES5Object:
              if (hasObjectChanges(state)) { markChangedES5(state); }
              break;
          }
        }
      }
    }

    function markChangesRecursively(object) {
      if (!object || typeof object !== "object") { return; }
      var state = object[DRAFT_STATE];
      if (!state) { return; }
      var base = state.base,
          draft = state.draft,
          assigned = state.assigned,
          type = state.type;

      if (type === ProxyType.ES5Object) {
        // Look for added keys.
        // TODO: looks quite duplicate to hasObjectChanges,
        // probably there is a faster way to detect changes, as sweep + recurse seems to do some
        // unnecessary work.
        // also: probably we can store the information we detect here, to speed up tree finalization!
        each(draft, function (key) {
          if (key === DRAFT_STATE) { return; } // The `undefined` check is a fast path for pre-existing keys.

          if (base[key] === undefined && !has(base, key)) {
            assigned[key] = true;
            markChangedES5(state);
          } else if (!assigned[key]) {
            // Only untouched properties trigger recursion.
            markChangesRecursively(draft[key]);
          }
        }); // Look for removed keys.

        each(base, function (key) {
          // The `undefined` check is a fast path for pre-existing keys.
          if (draft[key] === undefined && !has(draft, key)) {
            assigned[key] = false;
            markChangedES5(state);
          }
        });
      } else if (type === ProxyType.ES5Array) {
        if (hasArrayChanges(state)) {
          markChangedES5(state);
          assigned.length = true;
        }

        if (draft.length < base.length) {
          for (var i = draft.length; i < base.length; i++) { assigned[i] = false; }
        } else {
          for (var i = base.length; i < draft.length; i++) { assigned[i] = true; }
        } // Minimum count is enough, the other parts has been processed.


        var min = Math.min(draft.length, base.length);

        for (var i = 0; i < min; i++) {
          // Only untouched indices trigger recursion.
          if (assigned[i] === undefined) { markChangesRecursively(draft[i]); }
        }
      }
    }

    function hasObjectChanges(state) {
      var base = state.base,
          draft = state.draft; // Search for added keys and changed keys. Start at the back, because
      // non-numeric keys are ordered by time of definition on the object.

      var keys = Object.keys(draft);

      for (var i = keys.length - 1; i >= 0; i--) {
        var key = keys[i];
        var baseValue = base[key]; // The `undefined` check is a fast path for pre-existing keys.

        if (baseValue === undefined && !has(base, key)) {
          return true;
        } // Once a base key is deleted, future changes go undetected, because its
        // descriptor is erased. This branch detects any missed changes.
        else {
            var value = draft[key];
            var state_1 = value && value[DRAFT_STATE];

            if (state_1 ? state_1.base !== baseValue : !is(value, baseValue)) {
              return true;
            }
          }
      } // At this point, no keys were added or changed.
      // Compare key count to determine if keys were deleted.


      return keys.length !== Object.keys(base).length;
    }

    function hasArrayChanges(state) {
      var draft = state.draft;
      if (draft.length !== state.base.length) { return true; } // See #116
      // If we first shorten the length, our array interceptors will be removed.
      // If after that new items are added, result in the same original length,
      // those last items will have no intercepting property.
      // So if there is no own descriptor on the last position, we know that items were removed and added
      // N.B.: splice, unshift, etc only shift values around, but not prop descriptors, so we only have to check
      // the last one

      var descriptor = Object.getOwnPropertyDescriptor(draft, draft.length - 1); // descriptor can be null, but only for newly created sparse arrays, eg. new Array(10)

      if (descriptor && !descriptor.get) { return true; } // For all other cases, we don't have to compare, as they would have been picked up by the index setters

      return false;
    }

    var DraftMap = function (_super) {
      if (!_super) {
        /* istanbul ignore next */
        throw new Error("Map is not polyfilled");
      }

      __extends(DraftMap, _super); // Create class manually, cause #502


      function DraftMap(target, parent) {
        this[DRAFT_STATE] = {
          type: ProxyType.Map,
          parent: parent,
          scope: parent ? parent.scope : ImmerScope.current,
          modified: false,
          finalized: false,
          copy: undefined,
          assigned: undefined,
          base: target,
          draft: this,
          isManual: false,
          revoked: false
        };
        return this;
      }

      var p = DraftMap.prototype; // TODO: smaller build size if we create a util for Object.defineProperty

      Object.defineProperty(p, "size", {
        get: function () {
          return latest(this[DRAFT_STATE]).size;
        },
        enumerable: true,
        configurable: true
      });

      p.has = function (key) {
        return latest(this[DRAFT_STATE]).has(key);
      };

      p.set = function (key, value) {
        var state = this[DRAFT_STATE];
        assertUnrevoked(state);

        if (latest(state).get(key) !== value) {
          prepareCopy$2(state);
          state.scope.immer.markChanged(state);
          state.assigned.set(key, true);
          state.copy.set(key, value);
          state.assigned.set(key, true);
        }

        return this;
      };

      p.delete = function (key) {
        if (!this.has(key)) {
          return false;
        }

        var state = this[DRAFT_STATE];
        assertUnrevoked(state);
        prepareCopy$2(state);
        state.scope.immer.markChanged(state);
        state.assigned.set(key, false);
        state.copy.delete(key);
        return true;
      };

      p.clear = function () {
        var state = this[DRAFT_STATE];
        assertUnrevoked(state);
        prepareCopy$2(state);
        state.scope.immer.markChanged(state);
        state.assigned = new Map();
        return state.copy.clear();
      };

      p.forEach = function (cb, thisArg) {
        var _this = this;

        var state = this[DRAFT_STATE];
        latest(state).forEach(function (_value, key, _map) {
          cb.call(thisArg, _this.get(key), key, _this);
        });
      };

      p.get = function (key) {
        var state = this[DRAFT_STATE];
        assertUnrevoked(state);
        var value = latest(state).get(key);

        if (state.finalized || !isDraftable(value)) {
          return value;
        }

        if (value !== state.base.get(key)) {
          return value; // either already drafted or reassigned
        } // despite what it looks, this creates a draft only once, see above condition


        var draft = state.scope.immer.createProxy(value, state);
        prepareCopy$2(state);
        state.copy.set(key, draft);
        return draft;
      };

      p.keys = function () {
        return latest(this[DRAFT_STATE]).keys();
      };

      p.values = function () {
        var _a;

        var _this = this;

        var iterator = this.keys();
        return _a = {}, _a[iteratorSymbol] = function () {
          return _this.values();
        }, _a.next = function () {
          var r = iterator.next();
          /* istanbul ignore next */

          if (r.done) { return r; }

          var value = _this.get(r.value);

          return {
            done: false,
            value: value
          };
        }, _a;
      };

      p.entries = function () {
        var _a;

        var _this = this;

        var iterator = this.keys();
        return _a = {}, _a[iteratorSymbol] = function () {
          return _this.entries();
        }, _a.next = function () {
          var r = iterator.next();
          /* istanbul ignore next */

          if (r.done) { return r; }

          var value = _this.get(r.value);

          return {
            done: false,
            value: [r.value, value]
          };
        }, _a;
      };

      p[iteratorSymbol] = function () {
        return this.entries();
      };

      return DraftMap;
    }(Map);

    function proxyMap(target, parent) {
      // @ts-ignore
      return new DraftMap(target, parent);
    }

    function prepareCopy$2(state) {
      if (!state.copy) {
        state.assigned = new Map();
        state.copy = new Map(state.base);
      }
    }

    var DraftSet = function (_super) {
      if (!_super) {
        /* istanbul ignore next */
        throw new Error("Set is not polyfilled");
      }

      __extends(DraftSet, _super); // Create class manually, cause #502


      function DraftSet(target, parent) {
        this[DRAFT_STATE] = {
          type: ProxyType.Set,
          parent: parent,
          scope: parent ? parent.scope : ImmerScope.current,
          modified: false,
          finalized: false,
          copy: undefined,
          base: target,
          draft: this,
          drafts: new Map(),
          revoked: false,
          isManual: false
        };
        return this;
      }

      var p = DraftSet.prototype;
      Object.defineProperty(p, "size", {
        get: function () {
          return latest(this[DRAFT_STATE]).size;
        },
        enumerable: true,
        configurable: true
      });

      p.has = function (value) {
        var state = this[DRAFT_STATE];
        assertUnrevoked(state); // bit of trickery here, to be able to recognize both the value, and the draft of its value

        if (!state.copy) {
          return state.base.has(value);
        }

        if (state.copy.has(value)) { return true; }
        if (state.drafts.has(value) && state.copy.has(state.drafts.get(value))) { return true; }
        return false;
      };

      p.add = function (value) {
        var state = this[DRAFT_STATE];
        assertUnrevoked(state);

        if (state.copy) {
          state.copy.add(value);
        } else if (!state.base.has(value)) {
          prepareCopy$3(state);
          state.scope.immer.markChanged(state);
          state.copy.add(value);
        }

        return this;
      };

      p.delete = function (value) {
        if (!this.has(value)) {
          return false;
        }

        var state = this[DRAFT_STATE];
        assertUnrevoked(state);
        prepareCopy$3(state);
        state.scope.immer.markChanged(state);
        return state.copy.delete(value) || (state.drafts.has(value) ? state.copy.delete(state.drafts.get(value)) :
        /* istanbul ignore next */
        false);
      };

      p.clear = function () {
        var state = this[DRAFT_STATE];
        assertUnrevoked(state);
        prepareCopy$3(state);
        state.scope.immer.markChanged(state);
        return state.copy.clear();
      };

      p.values = function () {
        var state = this[DRAFT_STATE];
        assertUnrevoked(state);
        prepareCopy$3(state);
        return state.copy.values();
      };

      p.entries = function entries() {
        var state = this[DRAFT_STATE];
        assertUnrevoked(state);
        prepareCopy$3(state);
        return state.copy.entries();
      };

      p.keys = function () {
        return this.values();
      };

      p[iteratorSymbol] = function () {
        return this.values();
      };

      p.forEach = function forEach(cb, thisArg) {
        var iterator = this.values();
        var result = iterator.next();

        while (!result.done) {
          cb.call(thisArg, result.value, result.value, this);
          result = iterator.next();
        }
      };

      return DraftSet;
    }(Set);

    function proxySet(target, parent) {
      // @ts-ignore
      return new DraftSet(target, parent);
    }

    function prepareCopy$3(state) {
      if (!state.copy) {
        // create drafts for all entries to preserve insertion order
        state.copy = new Set();
        state.base.forEach(function (value) {
          if (isDraftable(value)) {
            var draft = state.scope.immer.createProxy(value, state);
            state.drafts.set(value, draft);
            state.copy.add(draft);
          } else {
            state.copy.add(value);
          }
        });
      }
    }

    function generatePatches(state, basePath, patches, inversePatches) {
      switch (state.type) {
        case ProxyType.ProxyObject:
        case ProxyType.ES5Object:
        case ProxyType.Map:
          return generatePatchesFromAssigned(state, basePath, patches, inversePatches);

        case ProxyType.ES5Array:
        case ProxyType.ProxyArray:
          return generateArrayPatches(state, basePath, patches, inversePatches);

        case ProxyType.Set:
          return generateSetPatches(state, basePath, patches, inversePatches);
      }
    }

    function generateArrayPatches(state, basePath, patches, inversePatches) {
      var _a, _b;

      var base = state.base,
          assigned = state.assigned,
          copy = state.copy;
      /* istanbul ignore next */

      if (!copy) { die(); } // Reduce complexity by ensuring `base` is never longer.

      if (copy.length < base.length) {
        _a = [copy, base], base = _a[0], copy = _a[1];
        _b = [inversePatches, patches], patches = _b[0], inversePatches = _b[1];
      }

      var delta = copy.length - base.length; // Find the first replaced index.

      var start = 0;

      while (base[start] === copy[start] && start < base.length) {
        ++start;
      } // Find the last replaced index. Search from the end to optimize splice patches.


      var end = base.length;

      while (end > start && base[end - 1] === copy[end + delta - 1]) {
        --end;
      } // Process replaced indices.


      for (var i = start; i < end; ++i) {
        if (assigned[i] && copy[i] !== base[i]) {
          var path = basePath.concat([i]);
          patches.push({
            op: "replace",
            path: path,
            value: copy[i]
          });
          inversePatches.push({
            op: "replace",
            path: path,
            value: base[i]
          });
        }
      }

      var replaceCount = patches.length; // Process added indices.

      for (var i = end + delta - 1; i >= end; --i) {
        var path = basePath.concat([i]);
        patches[replaceCount + i - end] = {
          op: "add",
          path: path,
          value: copy[i]
        };
        inversePatches.push({
          op: "remove",
          path: path
        });
      }
    } // This is used for both Map objects and normal objects.


    function generatePatchesFromAssigned(state, basePath, patches, inversePatches) {
      var base = state.base,
          copy = state.copy;
      each(state.assigned, function (key, assignedValue) {
        var origValue = get(base, key);
        var value = get(copy, key);
        var op = !assignedValue ? "remove" : has(base, key) ? "replace" : "add";
        if (origValue === value && op === "replace") { return; }
        var path = basePath.concat(key);
        patches.push(op === "remove" ? {
          op: op,
          path: path
        } : {
          op: op,
          path: path,
          value: value
        });
        inversePatches.push(op === "add" ? {
          op: "remove",
          path: path
        } : op === "remove" ? {
          op: "add",
          path: path,
          value: origValue
        } : {
          op: "replace",
          path: path,
          value: origValue
        });
      });
    }

    function generateSetPatches(state, basePath, patches, inversePatches) {
      var base = state.base,
          copy = state.copy;
      var i = 0;
      base.forEach(function (value) {
        if (!copy.has(value)) {
          var path = basePath.concat([i]);
          patches.push({
            op: "remove",
            path: path,
            value: value
          });
          inversePatches.unshift({
            op: "add",
            path: path,
            value: value
          });
        }

        i++;
      });
      i = 0;
      copy.forEach(function (value) {
        if (!base.has(value)) {
          var path = basePath.concat([i]);
          patches.push({
            op: "add",
            path: path,
            value: value
          });
          inversePatches.unshift({
            op: "remove",
            path: path,
            value: value
          });
        }

        i++;
      });
    }

    function applyPatches(draft, patches) {
      patches.forEach(function (patch) {
        var path = patch.path,
            op = patch.op;
        /* istanbul ignore next */

        if (!path.length) { die(); }
        var base = draft;

        for (var i = 0; i < path.length - 1; i++) {
          base = get(base, path[i]);
          if (!base || typeof base !== "object") { throw new Error("Cannot apply patch, path doesn't resolve: " + path.join("/")); } // prettier-ignore
        }

        var type = getArchtype(base);
        var value = deepClonePatchValue(patch.value); // used to clone patch to ensure original patch is not modified, see #411

        var key = path[path.length - 1];

        switch (op) {
          case "replace":
            switch (type) {
              case Archtype.Map:
                return base.set(key, value);

              /* istanbul ignore next */

              case Archtype.Set:
                throw new Error('Sets cannot have "replace" patches.');

              default:
                // if value is an object, then it's assigned by reference
                // in the following add or remove ops, the value field inside the patch will also be modifyed
                // so we use value from the cloned patch
                // @ts-ignore
                return base[key] = value;
            }

          case "add":
            switch (type) {
              case Archtype.Array:
                return base.splice(key, 0, value);

              case Archtype.Map:
                return base.set(key, value);

              case Archtype.Set:
                return base.add(value);

              default:
                return base[key] = value;
            }

          case "remove":
            switch (type) {
              case Archtype.Array:
                return base.splice(key, 1);

              case Archtype.Map:
                return base.delete(key);

              case Archtype.Set:
                return base.delete(patch.value);

              default:
                return delete base[key];
            }

          default:
            throw new Error("Unsupported patch operation: " + op);
        }
      });
      return draft;
    }

    function deepClonePatchValue(obj) {
      if (!obj || typeof obj !== "object") { return obj; }
      if (Array.isArray(obj)) { return obj.map(deepClonePatchValue); }
      if (isMap(obj)) { return new Map(Array.from(obj.entries()).map(function (_a) {
        var k = _a[0],
            v = _a[1];
        return [k, deepClonePatchValue(v)];
      })); }
      if (isSet(obj)) { return new Set(Array.from(obj).map(deepClonePatchValue)); }
      var cloned = Object.create(Object.getPrototypeOf(obj));

      for (var key in obj) { cloned[key] = deepClonePatchValue(obj[key]); }

      return cloned;
    }

    /*! *****************************************************************************
    Copyright (c) Microsoft Corporation. All rights reserved.
    Licensed under the Apache License, Version 2.0 (the "License"); you may not use
    this file except in compliance with the License. You may obtain a copy of the
    License at http://www.apache.org/licenses/LICENSE-2.0

    THIS CODE IS PROVIDED ON AN *AS IS* BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
    KIND, EITHER EXPRESS OR IMPLIED, INCLUDING WITHOUT LIMITATION ANY IMPLIED
    WARRANTIES OR CONDITIONS OF TITLE, FITNESS FOR A PARTICULAR PURPOSE,
    MERCHANTABLITY OR NON-INFRINGEMENT.

    See the Apache Version 2.0 License for specific language governing permissions
    and limitations under the License.
    ***************************************************************************** */

    function __spreadArrays() {
        for (var s = 0, i = 0, il = arguments.length; i < il; i++) s += arguments[i].length;
        for (var r = Array(s), k = 0, i = 0; i < il; i++)
            for (var a = arguments[i], j = 0, jl = a.length; j < jl; j++, k++)
                r[k] = a[j];
        return r;
    }

    /* istanbul ignore next */

    function verifyMinified() {}

    var configDefaults = {
      useProxies: typeof Proxy !== "undefined" && typeof Proxy.revocable !== "undefined" && typeof Reflect !== "undefined",
      autoFreeze: typeof process !== "undefined" ? process.env.NODE_ENV !== "production" :
      /* istanbul ignore next */
      verifyMinified.name === "verifyMinified",
      onAssign: null,
      onDelete: null,
      onCopy: null
    };

    var Immer =
    /** @class */
    function () {
      function Immer(config) {
        var _this = this;

        this.useProxies = false;
        this.autoFreeze = false;
        each(configDefaults, function (key, value) {
          var _a, _b; // @ts-ignore


          _this[key] = (_b = (_a = config) === null || _a === void 0 ? void 0 : _a[key], _b !== null && _b !== void 0 ? _b : value);
        });
        this.setUseProxies(this.useProxies);
        this.produce = this.produce.bind(this);
        this.produceWithPatches = this.produceWithPatches.bind(this);
      }
      /**
       * The `produce` function takes a value and a "recipe function" (whose
       * return value often depends on the base state). The recipe function is
       * free to mutate its first argument however it wants. All mutations are
       * only ever applied to a __copy__ of the base state.
       *
       * Pass only a function to create a "curried producer" which relieves you
       * from passing the recipe function every time.
       *
       * Only plain objects and arrays are made mutable. All other objects are
       * considered uncopyable.
       *
       * Note: This function is __bound__ to its `Immer` instance.
       *
       * @param {any} base - the initial state
       * @param {Function} producer - function that receives a proxy of the base state as first argument and which can be freely modified
       * @param {Function} patchListener - optional function that will be called with all the patches produced here
       * @returns {any} a new state, or the initial state if nothing was modified
       */


      Immer.prototype.produce = function (base, recipe, patchListener) {
        var _this = this; // curried invocation


        if (typeof base === "function" && typeof recipe !== "function") {
          var defaultBase_1 = recipe;
          recipe = base;
          var self_1 = this;
          return function curriedProduce(base) {
            var arguments$1 = arguments;

            var _this = this;

            if (base === void 0) {
              base = defaultBase_1;
            }

            var args = [];

            for (var _i = 1; _i < arguments.length; _i++) {
              args[_i - 1] = arguments$1[_i];
            }

            return self_1.produce(base, function (draft) {
              return recipe.call.apply(recipe, __spreadArrays([_this, draft], args));
            }); // prettier-ignore
          };
        } // prettier-ignore


        {
          if (typeof recipe !== "function") {
            throw new Error("The first or second argument to `produce` must be a function");
          }

          if (patchListener !== undefined && typeof patchListener !== "function") {
            throw new Error("The third argument to `produce` must be a function or undefined");
          }
        }
        var result; // Only plain objects, arrays, and "immerable classes" are drafted.

        if (isDraftable(base)) {
          var scope_1 = ImmerScope.enter(this);
          var proxy = this.createProxy(base, undefined);
          var hasError = true;

          try {
            result = recipe(proxy);
            hasError = false;
          } finally {
            // finally instead of catch + rethrow better preserves original stack
            if (hasError) { scope_1.revoke(); }else { scope_1.leave(); }
          }

          if (typeof Promise !== "undefined" && result instanceof Promise) {
            return result.then(function (result) {
              scope_1.usePatches(patchListener);
              return processResult(_this, result, scope_1);
            }, function (error) {
              scope_1.revoke();
              throw error;
            });
          }

          scope_1.usePatches(patchListener);
          return processResult(this, result, scope_1);
        } else {
          result = recipe(base);
          if (result === NOTHING) { return undefined; }
          if (result === undefined) { result = base; }
          maybeFreeze(this, result, true);
          return result;
        }
      };

      Immer.prototype.produceWithPatches = function (arg1, arg2, arg3) {
        var _this = this;

        if (typeof arg1 === "function") {
          return function (state) {
            var arguments$1 = arguments;

            var args = [];

            for (var _i = 1; _i < arguments.length; _i++) {
              args[_i - 1] = arguments$1[_i];
            }

            return _this.produceWithPatches(state, function (draft) {
              return arg1.apply(void 0, __spreadArrays([draft], args));
            });
          };
        } // non-curried form

        /* istanbul ignore next */


        if (arg3) { die(); }
        var patches, inversePatches;
        var nextState = this.produce(arg1, arg2, function (p, ip) {
          patches = p;
          inversePatches = ip;
        });
        return [nextState, patches, inversePatches];
      };

      Immer.prototype.createDraft = function (base) {
        if (!isDraftable(base)) {
          throw new Error("First argument to `createDraft` must be a plain object, an array, or an immerable object"); // prettier-ignore
        }

        var scope = ImmerScope.enter(this);
        var proxy = this.createProxy(base, undefined);
        proxy[DRAFT_STATE].isManual = true;
        scope.leave();
        return proxy;
      };

      Immer.prototype.finishDraft = function (draft, patchListener) {
        var state = draft && draft[DRAFT_STATE];

        if (!state || !state.isManual) {
          throw new Error("First argument to `finishDraft` must be a draft returned by `createDraft`"); // prettier-ignore
        }

        if (state.finalized) {
          throw new Error("The given draft is already finalized"); // prettier-ignore
        }

        var scope = state.scope;
        scope.usePatches(patchListener);
        return processResult(this, undefined, scope);
      };
      /**
       * Pass true to automatically freeze all copies created by Immer.
       *
       * By default, auto-freezing is disabled in production.
       */


      Immer.prototype.setAutoFreeze = function (value) {
        this.autoFreeze = value;
      };
      /**
       * Pass true to use the ES2015 `Proxy` class when creating drafts, which is
       * always faster than using ES5 proxies.
       *
       * By default, feature detection is used, so calling this is rarely necessary.
       */


      Immer.prototype.setUseProxies = function (value) {
        this.useProxies = value;
      };

      Immer.prototype.applyPatches = function (base, patches) {
        // If a patch replaces the entire state, take that replacement as base
        // before applying patches
        var i;

        for (i = patches.length - 1; i >= 0; i--) {
          var patch = patches[i];

          if (patch.path.length === 0 && patch.op === "replace") {
            base = patch.value;
            break;
          }
        }

        if (isDraft(base)) {
          // N.B: never hits if some patch a replacement, patches are never drafts
          return applyPatches(base, patches);
        } // Otherwise, produce a copy of the base state.


        return this.produce(base, function (draft) {
          return applyPatches(draft, patches.slice(i + 1));
        });
      };

      Immer.prototype.createProxy = function (value, parent) {
        // precondition: createProxy should be guarded by isDraftable, so we know we can safely draft
        var draft = isMap(value) ? proxyMap(value, parent) : isSet(value) ? proxySet(value, parent) : this.useProxies ? createProxy(value, parent) : createES5Proxy(value, parent);
        var scope = parent ? parent.scope : ImmerScope.current;
        scope.drafts.push(draft);
        return draft;
      };

      Immer.prototype.willFinalize = function (scope, thing, isReplaced) {
        if (!this.useProxies) { willFinalizeES5(scope, thing, isReplaced); }
      };

      Immer.prototype.markChanged = function (state) {
        if (this.useProxies) {
          markChanged(state);
        } else {
          markChangedES5(state);
        }
      };

      return Immer;
    }();

    var immer = new Immer();
    /**
     * The `produce` function takes a value and a "recipe function" (whose
     * return value often depends on the base state). The recipe function is
     * free to mutate its first argument however it wants. All mutations are
     * only ever applied to a __copy__ of the base state.
     *
     * Pass only a function to create a "curried producer" which relieves you
     * from passing the recipe function every time.
     *
     * Only plain objects and arrays are made mutable. All other objects are
     * considered uncopyable.
     *
     * Note: This function is __bound__ to its `Immer` instance.
     *
     * @param {any} base - the initial state
     * @param {Function} producer - function that receives a proxy of the base state as first argument and which can be freely modified
     * @param {Function} patchListener - optional function that will be called with all the patches produced here
     * @returns {any} a new state, or the initial state if nothing was modified
     */

    var produce = immer.produce;
    /**
     * Like `produce`, but `produceWithPatches` always returns a tuple
     * [nextState, patches, inversePatches] (instead of just the next state)
     */

    var produceWithPatches = immer.produceWithPatches.bind(immer);
    /**
     * Pass true to automatically freeze all copies created by Immer.
     *
     * By default, auto-freezing is disabled in production.
     */

    var setAutoFreeze = immer.setAutoFreeze.bind(immer);
    /**
     * Pass true to use the ES2015 `Proxy` class when creating drafts, which is
     * always faster than using ES5 proxies.
     *
     * By default, feature detection is used, so calling this is rarely necessary.
     */

    var setUseProxies = immer.setUseProxies.bind(immer);
    /**
     * Apply an array of Immer patches to the first argument.
     *
     * This function is a producer, which means copy-on-write is in effect.
     */

    var applyPatches$1 = immer.applyPatches.bind(immer);
    /**
     * Create an Immer draft from the given base state, which may be a draft itself.
     * The draft can be modified until you finalize it with the `finishDraft` function.
     */

    var createDraft = immer.createDraft.bind(immer);
    /**
     * Finalize an Immer draft from a `createDraft` call, returning the base state
     * (if no changes were made) or a modified copy. The draft must *not* be
     * mutated afterwards.
     *
     * Pass a function as the 2nd argument to generate Immer patches based on the
     * changes that were made.
     */

    var finishDraft = immer.finishDraft.bind(immer);

    function createHistory() {
      const initial = { past: [], current: null, index: -1, future: [], all: [] };
      const { update, set, subscribe } = writable(initial);
      const step = (history, steps) =>
        produce(history, (draft) => {
          if (steps > 0) {
            let arr = draft.future.slice(0, steps);
            draft.future =
              steps > draft.future.length ? [] : draft.future.slice(steps, draft.future.length);
            draft.past = draft.past.concat(arr);
          } else {
            let i = Math.max(draft.past.length + steps, 1);
            let arr = draft.past.slice(i, draft.past.length);
            draft.past = draft.past.slice(0, i);
            draft.future = arr.concat(draft.future);
          }
          draft.index = draft.past.length - 1;
          draft.current = draft.past[draft.index];
          draft.all = draft.past.concat(draft.future);
        });
      return {
        subscribe,
        push: (state) =>
          update((history) =>
            produce(history, (draft) => {
              draft.current = state;
              draft.past.push(draft.current);
              draft.index = draft.past.length - 1;
              draft.future = [];
              draft.all = draft.past.concat(draft.future);
            })
          ),
        step: (steps) => update((history) => step(history, steps)),
        goTo: (index) => update((history) => step(history, index - history.index)),
        undo: () =>
          update((history) => {
            return produce(step(history, -1), (draft) => {
              draft.future = draft.future.slice(1);
              draft.all = draft.past.concat(draft.future);
            });
          }),
        reset: () => set(initial),
      };
    }

    const history = createHistory();

    function createDragdropData() {
      const { subscribe, set, update } = writable({ drag: null, drop: null });
      return {
        subscribe,
        setDrag: (node) => update((state) => Object.assign(state, { drag: node })),
        setDrop: (node) => update((state) => Object.assign(state, { drop: node })),
      };
    }
    const dragdropData = createDragdropData();
    const parse$1 = new CTATAlgebraParser();
    window.parse = parse$1;
    window.setEqn = (newEqn) => {
      history.reset();
      history.push(window.parse.algParse(newEqn));
    };

    const initial = null;

    // Contains data that will be used in draftOperation.apply() to create an SAI for the Tutor
    let dragOperation = {
      side: null,
      from: null,
      to: null,
    };

    /**
     * Creates an draftEquation store, which can be globally accessed and updated by any Svelte element;
     * convenient to apply draft operations from any child component without needing to provide it a function as a prop
     * @param {CTATAlgebraTreeNode} initial the initial state of the equation
     */
    function createDraftEquation() {
      // let initial = window.parse.algParse('2*(3+2)/(4/x) = 1 - ?');
      const { subscribe, set, update } = writable(initial);

      /**
       * Will perform a draft operation on the equation, i.e. will change the equation, but not write to history
       *
       * @param {EquationNode} src the source EquationNode
       * @param {EquationNode} dest the destination EquationNode
       * @param {*} eqn the current equation
       * @returns new modified equation
       */
      function draftOperation(src, dest, eqn) {
        eqn = get_store_value(history).current; //the draft equation will always reset to the head of the history stack before applying draft operations; otherwise the draft would be multiple steps ahead of the current equation

        // eqn = initial;
        if (src === dest)
          //if src and dest are the same, we're dragging an node onto itself, so nothing happens
          return eqn;
        //we determine what to do based on what the src and dest is
        //some of these may never trigger given how the interface manages type checking for its drag/drop operations
        console.log(src, dest);
        if (src instanceof Token) {
          if (dest instanceof Token) {
            return tokenToToken(src, dest, eqn);
          } else if (dest instanceof Expression) {
            return tokenToExpression(src, dest, eqn);
          } else if (dest instanceof Operator) {
            return tokenToOperator(src, dest, eqn);
          } else {
            throw new TypeError("Drag destination is not a proper item type");
          }
        } else if (src instanceof Expression) {
          if (dest instanceof Token) {
            return expressionToToken(src, dest);
          } else if (dest instanceof Expression) {
            return expressionToExpression(src, dest);
          } else if (dest instanceof Operator) {
            return expressionToOperator(src, dest, eqn);
          } else {
            throw new TypeError("Drag destination is not a proper item type");
          }
        } else if (src instanceof Operator) {
          if (dest instanceof Token) {
            return operatorToToken(src, dest, eqn);
          } else if (dest instanceof Expression) {
            return operatorToExpression(src, dest, eqn);
          } else if (dest instanceof Operator) {
            return operatorToOperator(src, dest, eqn);
          } else {
            throw new TypeError("Drag destination is not a proper item type");
          }
        } else {
          throw new TypeError("Drag source is not a proper item type");
        }
      }

      /**
       * Pushes the current draft equation onto the history stack and sends an SAI to the Tutor describing the operation that has been performed
       *
       * @param {*} eqn the current draft equation
       * @returns the current draft equation (shouldn't have been modified)
       */
      function apply(eqn) {
        let sai = new CTATSAI(
          dragOperation.side,
          dragOperation.from + "To" + dragOperation.to,
          parse$1.algStringify(eqn)
        );
        console.log(`%c${sai.toXMLString()}`, "color: #15f");

        if (CTATCommShell.commShell) {
          CTATCommShell.commShell.processComponentAction(sai);
        }
        if (
          get_store_value(history).current !== eqn &&
          parse$1.algStringify(get_store_value(history).current) !== parse$1.algStringify(eqn)
        ) {
          history.push(eqn);
        }
        return eqn;
      }

      /**
       * Updates an unknown token with a value in the case where a student *types* in a value into an UnknownToken; dragging a value to an UnknownToken is accounted for in draftOperation
       *
       * @param {*} eqn the current draft equation
       * @param {UnknownToken} token the token being modified
       * @param {string|number} value the value to put in the token
       * @returns modified equation
       */
      function updateToken(eqn, token, value) {
        eqn = get_store_value(history).current;
        dragOperation = { from: "Update", to: "Token", side: token.path[0] };
        let target = Object.path(eqn, token.path);
        let newToken = parse$1.algParse(value);
        newToken.sign = target.sign;
        newToken.exp = target.exp;
        let next = parse$1.algReplaceExpression(eqn, target, newToken);
        return apply(next);
      }

      return {
        subscribe,
        draftOperation: (src, dest) => update((eqn) => draftOperation(src, dest, eqn)),
        updateToken: (token, value) => update((eqn) => updateToken(eqn, token, value)),
        apply: () => update((eqn) => apply(eqn)),
        reset: () => set(initial),
        set: (eqn) => set(eqn),
      };
    }

    const draftEquation = createDraftEquation();

    /**
     * Extends Object with the path function which traverses an object via the specified path array
     * e.g. Object.path({a: {b: c: ['foo', 'bar']}}, ['a', 'b', 'c', 1]) returns 'bar'
     */
    Object.path = (o, p) => p.reduce((xs, x) => (xs && xs[x] ? xs[x] : null), o);

    /**
     * When a token is dragged onto a token, the following should happen:
     * if the destination is the unknown operator ("?"), then replace its value with the source's value and return the result
     * else if the two tokens have the same parent (of the same expression), then combine them with respect to their operators
     * else this drag operation is not algebraically valid, thus nothing happens
     * @param {Object} src source object containing the node and its path
     * @param {Object} dest destination object containing the node and its path
     * @param {CTATAlgebraTreeNode} eqn the current equation
     */
    function tokenToToken(src, dest, eqn) {
      dragOperation = { from: "Token", to: "Token", side: dest.path[0] };
      console.log(src, dest);

      if (dest instanceof UnknownToken) {
        let d = Object.path(eqn, dest.path);
        let s = parse$1.algParse(src.value());
        s.exp = d.exp;
        s.sign = d.sign; //have to do this because the grammar will otherwise take the sign of the source e.g. 1 - ? (drag 1 to ?) results in 1 + 1 not 1 - 1 as expected
        return parse$1.algReplaceExpression(eqn, d, s);
      } else if (src.parent === dest.parent) {
        let parentPath = src.path.slice(0, -2);
        let parent = Object.path(eqn, parentPath);
        let indices = src.indices.concat(dest.indices);
        console.log(indices);

        indices.sort();
        let next = parse$1.algReplaceExpression(
          eqn,
          parent,
          parse$1.algApplyRulesSelectively(parent, ["combineSimilar"], false, ...indices)
        );
        console.log(parse$1.algStringify(next));

        parent = Object.path(next, parentPath);
        return parse$1.algReplaceExpression(
          next,
          parent,
          parse$1.algApplyRules(parent, ["removeIdentity"])
        );
      } else {
        return eqn;
      }
    }

    /**
     * When a token is dragged onto an expression, the following should happen:
     * if the two items have the same parent (of the same expression), distribute the token upon the expression
     * else nothing happens
     * @param {Object} src source object containing the node and its path
     * @param {Object} dest destination object containing the node and its path
     * @param {CTATAlgebraTreeNode} eqn the current equation
     */
    function tokenToExpression(src, dest, eqn) {
      dragOperation = { from: "Token", to: "Expression", side: dest.path[0] };
      if (src.parent === dest.parent && !(src.parent instanceof Equation)) {
        let parent = Object.path(eqn, src.path.slice(0, -2));
        let i0 = parseInt(src.path.slice(-1)[0]);
        let i1 = parseInt(dest.path.slice(-1)[0]);
        return parse$1.algReplaceExpression(
          eqn,
          parent,
          parse$1.algApplyRulesSelectively(parent, ["distribute", "removeIdentity"], false, i0, i1)
        );
      } else {
        return eqn;
      }
    }

    /**
     * When a token is dragged on an operator, then nothing happens, because that doesn't make sense
     * @param {Object} src source object containing the node and its path
     * @param {Object} dest destination object containing the node and its path
     * @param {CTATAlgebraTreeNode} eqn the current equation
     */
    function tokenToOperator(src, dest, eqn) {
      dragOperation = { from: "Token", to: "Operator", side: dest.path[0] };
      return eqn;
    }

    function expressionToToken(src, dest, eqn) {
      dragOperation = { from: "Expression", to: "Token", side: dest.path[0] };
    }

    function expressionToExpression(src, dest, eqn) {
      dragOperation = { from: "Expression", to: "Expression", side: dest.path[0] };
    }

    /**
     * When an expression is dragged on an operator, then nothing happens, because that doesn't make sense
     * @param {Object} src source object containing the node and its path
     * @param {Object} dest destination object containing the node and its path
     * @param {CTATAlgebraTreeNode} eqn the current equation
     */
    function expressionToOperator(src, dest, eqn) {
      dragOperation = { from: "Expression", to: "Operator", side: dest.path[0] };
      return eqn;
    }

    function operatorToToken(src, dest, eqn) {
      dragOperation = { from: "Operator", to: "Token", side: dest.path[0] };
      let subexp;
      let indices = dest.indices;
      if (indices > 1) {
        indices.sort();
        let parent = Object.path(eqn, dest.path.slice(0, -2));
        subexp = parse$1.algGetExpression(parent, ...indices);
      } else {
        subexp = Object.path(eqn, dest.path);
      }
      let next = parse$1.algReplaceExpression(
        parse$1.algParse(parse$1.algStringify(eqn)),
        subexp,
        parse$1.algCreateExpression(src.operation, subexp, "?")
      );
      //TODO, unless I do parse.algParse(parse.algStringify(eqn)), the eqn is broken, breaking the history. It seems to be modifying eqn in place, not immutably
      return next;
    }

    function operatorToExpression(src, dest, eqn) {
      dragOperation = { from: "Operator", to: "Expression", side: dest.path[0] };
      // eqn = parse.algParse(parse.algStringify(eqn)); // TODO Weird error unless we do this;
      // console.log(eqn);

      // the grammar returns null on algReplaceExpression() if the token is dragged over the 9, then the ? in 3x + 6 = 9 /?, but not if the 9 is avoided
      let d = Object.path(eqn, dest.path);
      let next = parse$1.algReplaceExpression(eqn, d, parse$1.algCreateExpression(src.operation, d, "?"));

      return parse$1.algParse(parse$1.algStringify(next)); //TODO parentheses won't be included in grammar tree unless we do this; it will stringify nicely, but not remember parens in the object
    }

    /**
     * When an operator is dragged on an operator, then nothing happens, because it's probably too much of a hassle to rework the equation
     * @param {Object} src source object containing the node and its path
     * @param {Object} dest destination object containing the node and its path
     * @param {CTATAlgebraTreeNode} eqn the current equation
     */
    function operatorToOperator(src, dest, eqn) {
      //TODO this should be technically feasible to code, but it's probably not necessary to implement
      dragOperation = { from: "Operator", to: "Operator", side: dest.path[0] };
      return eqn;
    }

    var sprite = {
    	click: [
    		0,
    		159.90929705215422
    	],
    	error: [
    		2000,
    		309.34240362811806
    	],
    	haHa: [
    		4000,
    		948.9342403628118
    	],
    	hmm: [
    		6000,
    		1494.6031746031742
    	],
    	pop: [
    		9000,
    		80.40816326530553
    	]
    };
    var spriteMap = {
    	sprite: sprite
    };

    var commonjsGlobal = typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {};

    function createCommonjsModule(fn, module) {
    	return module = { exports: {} }, fn(module, module.exports), module.exports;
    }

    var howler = createCommonjsModule(function (module, exports) {
    /*!
     *  howler.js v2.1.3
     *  howlerjs.com
     *
     *  (c) 2013-2019, James Simpson of GoldFire Studios
     *  goldfirestudios.com
     *
     *  MIT License
     */

    (function() {

      /** Global Methods **/
      /***************************************************************************/

      /**
       * Create the global controller. All contained methods and properties apply
       * to all sounds that are currently playing or will be in the future.
       */
      var HowlerGlobal = function() {
        this.init();
      };
      HowlerGlobal.prototype = {
        /**
         * Initialize the global Howler object.
         * @return {Howler}
         */
        init: function() {
          var self = this || Howler;

          // Create a global ID counter.
          self._counter = 1000;

          // Pool of unlocked HTML5 Audio objects.
          self._html5AudioPool = [];
          self.html5PoolSize = 10;

          // Internal properties.
          self._codecs = {};
          self._howls = [];
          self._muted = false;
          self._volume = 1;
          self._canPlayEvent = 'canplaythrough';
          self._navigator = (typeof window !== 'undefined' && window.navigator) ? window.navigator : null;

          // Public properties.
          self.masterGain = null;
          self.noAudio = false;
          self.usingWebAudio = true;
          self.autoSuspend = true;
          self.ctx = null;

          // Set to false to disable the auto audio unlocker.
          self.autoUnlock = true;

          // Setup the various state values for global tracking.
          self._setup();

          return self;
        },

        /**
         * Get/set the global volume for all sounds.
         * @param  {Float} vol Volume from 0.0 to 1.0.
         * @return {Howler/Float}     Returns self or current volume.
         */
        volume: function(vol) {
          var self = this || Howler;
          vol = parseFloat(vol);

          // If we don't have an AudioContext created yet, run the setup.
          if (!self.ctx) {
            setupAudioContext();
          }

          if (typeof vol !== 'undefined' && vol >= 0 && vol <= 1) {
            self._volume = vol;

            // Don't update any of the nodes if we are muted.
            if (self._muted) {
              return self;
            }

            // When using Web Audio, we just need to adjust the master gain.
            if (self.usingWebAudio) {
              self.masterGain.gain.setValueAtTime(vol, Howler.ctx.currentTime);
            }

            // Loop through and change volume for all HTML5 audio nodes.
            for (var i=0; i<self._howls.length; i++) {
              if (!self._howls[i]._webAudio) {
                // Get all of the sounds in this Howl group.
                var ids = self._howls[i]._getSoundIds();

                // Loop through all sounds and change the volumes.
                for (var j=0; j<ids.length; j++) {
                  var sound = self._howls[i]._soundById(ids[j]);

                  if (sound && sound._node) {
                    sound._node.volume = sound._volume * vol;
                  }
                }
              }
            }

            return self;
          }

          return self._volume;
        },

        /**
         * Handle muting and unmuting globally.
         * @param  {Boolean} muted Is muted or not.
         */
        mute: function(muted) {
          var self = this || Howler;

          // If we don't have an AudioContext created yet, run the setup.
          if (!self.ctx) {
            setupAudioContext();
          }

          self._muted = muted;

          // With Web Audio, we just need to mute the master gain.
          if (self.usingWebAudio) {
            self.masterGain.gain.setValueAtTime(muted ? 0 : self._volume, Howler.ctx.currentTime);
          }

          // Loop through and mute all HTML5 Audio nodes.
          for (var i=0; i<self._howls.length; i++) {
            if (!self._howls[i]._webAudio) {
              // Get all of the sounds in this Howl group.
              var ids = self._howls[i]._getSoundIds();

              // Loop through all sounds and mark the audio node as muted.
              for (var j=0; j<ids.length; j++) {
                var sound = self._howls[i]._soundById(ids[j]);

                if (sound && sound._node) {
                  sound._node.muted = (muted) ? true : sound._muted;
                }
              }
            }
          }

          return self;
        },

        /**
         * Unload and destroy all currently loaded Howl objects.
         * @return {Howler}
         */
        unload: function() {
          var self = this || Howler;

          for (var i=self._howls.length-1; i>=0; i--) {
            self._howls[i].unload();
          }

          // Create a new AudioContext to make sure it is fully reset.
          if (self.usingWebAudio && self.ctx && typeof self.ctx.close !== 'undefined') {
            self.ctx.close();
            self.ctx = null;
            setupAudioContext();
          }

          return self;
        },

        /**
         * Check for codec support of specific extension.
         * @param  {String} ext Audio file extention.
         * @return {Boolean}
         */
        codecs: function(ext) {
          return (this || Howler)._codecs[ext.replace(/^x-/, '')];
        },

        /**
         * Setup various state values for global tracking.
         * @return {Howler}
         */
        _setup: function() {
          var self = this || Howler;

          // Keeps track of the suspend/resume state of the AudioContext.
          self.state = self.ctx ? self.ctx.state || 'suspended' : 'suspended';

          // Automatically begin the 30-second suspend process
          self._autoSuspend();

          // Check if audio is available.
          if (!self.usingWebAudio) {
            // No audio is available on this system if noAudio is set to true.
            if (typeof Audio !== 'undefined') {
              try {
                var test = new Audio();

                // Check if the canplaythrough event is available.
                if (typeof test.oncanplaythrough === 'undefined') {
                  self._canPlayEvent = 'canplay';
                }
              } catch(e) {
                self.noAudio = true;
              }
            } else {
              self.noAudio = true;
            }
          }

          // Test to make sure audio isn't disabled in Internet Explorer.
          try {
            var test = new Audio();
            if (test.muted) {
              self.noAudio = true;
            }
          } catch (e) {}

          // Check for supported codecs.
          if (!self.noAudio) {
            self._setupCodecs();
          }

          return self;
        },

        /**
         * Check for browser support for various codecs and cache the results.
         * @return {Howler}
         */
        _setupCodecs: function() {
          var self = this || Howler;
          var audioTest = null;

          // Must wrap in a try/catch because IE11 in server mode throws an error.
          try {
            audioTest = (typeof Audio !== 'undefined') ? new Audio() : null;
          } catch (err) {
            return self;
          }

          if (!audioTest || typeof audioTest.canPlayType !== 'function') {
            return self;
          }

          var mpegTest = audioTest.canPlayType('audio/mpeg;').replace(/^no$/, '');

          // Opera version <33 has mixed MP3 support, so we need to check for and block it.
          var checkOpera = self._navigator && self._navigator.userAgent.match(/OPR\/([0-6].)/g);
          var isOldOpera = (checkOpera && parseInt(checkOpera[0].split('/')[1], 10) < 33);

          self._codecs = {
            mp3: !!(!isOldOpera && (mpegTest || audioTest.canPlayType('audio/mp3;').replace(/^no$/, ''))),
            mpeg: !!mpegTest,
            opus: !!audioTest.canPlayType('audio/ogg; codecs="opus"').replace(/^no$/, ''),
            ogg: !!audioTest.canPlayType('audio/ogg; codecs="vorbis"').replace(/^no$/, ''),
            oga: !!audioTest.canPlayType('audio/ogg; codecs="vorbis"').replace(/^no$/, ''),
            wav: !!audioTest.canPlayType('audio/wav; codecs="1"').replace(/^no$/, ''),
            aac: !!audioTest.canPlayType('audio/aac;').replace(/^no$/, ''),
            caf: !!audioTest.canPlayType('audio/x-caf;').replace(/^no$/, ''),
            m4a: !!(audioTest.canPlayType('audio/x-m4a;') || audioTest.canPlayType('audio/m4a;') || audioTest.canPlayType('audio/aac;')).replace(/^no$/, ''),
            mp4: !!(audioTest.canPlayType('audio/x-mp4;') || audioTest.canPlayType('audio/mp4;') || audioTest.canPlayType('audio/aac;')).replace(/^no$/, ''),
            weba: !!audioTest.canPlayType('audio/webm; codecs="vorbis"').replace(/^no$/, ''),
            webm: !!audioTest.canPlayType('audio/webm; codecs="vorbis"').replace(/^no$/, ''),
            dolby: !!audioTest.canPlayType('audio/mp4; codecs="ec-3"').replace(/^no$/, ''),
            flac: !!(audioTest.canPlayType('audio/x-flac;') || audioTest.canPlayType('audio/flac;')).replace(/^no$/, '')
          };

          return self;
        },

        /**
         * Some browsers/devices will only allow audio to be played after a user interaction.
         * Attempt to automatically unlock audio on the first user interaction.
         * Concept from: http://paulbakaus.com/tutorials/html5/web-audio-on-ios/
         * @return {Howler}
         */
        _unlockAudio: function() {
          var self = this || Howler;

          // Only run this if Web Audio is supported and it hasn't already been unlocked.
          if (self._audioUnlocked || !self.ctx) {
            return;
          }

          self._audioUnlocked = false;
          self.autoUnlock = false;

          // Some mobile devices/platforms have distortion issues when opening/closing tabs and/or web views.
          // Bugs in the browser (especially Mobile Safari) can cause the sampleRate to change from 44100 to 48000.
          // By calling Howler.unload(), we create a new AudioContext with the correct sampleRate.
          if (!self._mobileUnloaded && self.ctx.sampleRate !== 44100) {
            self._mobileUnloaded = true;
            self.unload();
          }

          // Scratch buffer for enabling iOS to dispose of web audio buffers correctly, as per:
          // http://stackoverflow.com/questions/24119684
          self._scratchBuffer = self.ctx.createBuffer(1, 1, 22050);

          // Call this method on touch start to create and play a buffer,
          // then check if the audio actually played to determine if
          // audio has now been unlocked on iOS, Android, etc.
          var unlock = function(e) {
            // Create a pool of unlocked HTML5 Audio objects that can
            // be used for playing sounds without user interaction. HTML5
            // Audio objects must be individually unlocked, as opposed
            // to the WebAudio API which only needs a single activation.
            // This must occur before WebAudio setup or the source.onended
            // event will not fire.
            for (var i=0; i<self.html5PoolSize; i++) {
              try {
                var audioNode = new Audio();

                // Mark this Audio object as unlocked to ensure it can get returned
                // to the unlocked pool when released.
                audioNode._unlocked = true;

                // Add the audio node to the pool.
                self._releaseHtml5Audio(audioNode);
              } catch (e) {
                self.noAudio = true;
              }
            }

            // Loop through any assigned audio nodes and unlock them.
            for (var i=0; i<self._howls.length; i++) {
              if (!self._howls[i]._webAudio) {
                // Get all of the sounds in this Howl group.
                var ids = self._howls[i]._getSoundIds();

                // Loop through all sounds and unlock the audio nodes.
                for (var j=0; j<ids.length; j++) {
                  var sound = self._howls[i]._soundById(ids[j]);

                  if (sound && sound._node && !sound._node._unlocked) {
                    sound._node._unlocked = true;
                    sound._node.load();
                  }
                }
              }
            }

            // Fix Android can not play in suspend state.
            self._autoResume();

            // Create an empty buffer.
            var source = self.ctx.createBufferSource();
            source.buffer = self._scratchBuffer;
            source.connect(self.ctx.destination);

            // Play the empty buffer.
            if (typeof source.start === 'undefined') {
              source.noteOn(0);
            } else {
              source.start(0);
            }

            // Calling resume() on a stack initiated by user gesture is what actually unlocks the audio on Android Chrome >= 55.
            if (typeof self.ctx.resume === 'function') {
              self.ctx.resume();
            }

            // Setup a timeout to check that we are unlocked on the next event loop.
            source.onended = function() {
              source.disconnect(0);

              // Update the unlocked state and prevent this check from happening again.
              self._audioUnlocked = true;

              // Remove the touch start listener.
              document.removeEventListener('touchstart', unlock, true);
              document.removeEventListener('touchend', unlock, true);
              document.removeEventListener('click', unlock, true);

              // Let all sounds know that audio has been unlocked.
              for (var i=0; i<self._howls.length; i++) {
                self._howls[i]._emit('unlock');
              }
            };
          };

          // Setup a touch start listener to attempt an unlock in.
          document.addEventListener('touchstart', unlock, true);
          document.addEventListener('touchend', unlock, true);
          document.addEventListener('click', unlock, true);

          return self;
        },

        /**
         * Get an unlocked HTML5 Audio object from the pool. If none are left,
         * return a new Audio object and throw a warning.
         * @return {Audio} HTML5 Audio object.
         */
        _obtainHtml5Audio: function() {
          var self = this || Howler;

          // Return the next object from the pool if one exists.
          if (self._html5AudioPool.length) {
            return self._html5AudioPool.pop();
          }

          //.Check if the audio is locked and throw a warning.
          var testPlay = new Audio().play();
          if (testPlay && typeof Promise !== 'undefined' && (testPlay instanceof Promise || typeof testPlay.then === 'function')) {
            testPlay.catch(function() {
              console.warn('HTML5 Audio pool exhausted, returning potentially locked audio object.');
            });
          }

          return new Audio();
        },

        /**
         * Return an activated HTML5 Audio object to the pool.
         * @return {Howler}
         */
        _releaseHtml5Audio: function(audio) {
          var self = this || Howler;

          // Don't add audio to the pool if we don't know if it has been unlocked.
          if (audio._unlocked) {
            self._html5AudioPool.push(audio);
          }

          return self;
        },

        /**
         * Automatically suspend the Web Audio AudioContext after no sound has played for 30 seconds.
         * This saves processing/energy and fixes various browser-specific bugs with audio getting stuck.
         * @return {Howler}
         */
        _autoSuspend: function() {
          var self = this;

          if (!self.autoSuspend || !self.ctx || typeof self.ctx.suspend === 'undefined' || !Howler.usingWebAudio) {
            return;
          }

          // Check if any sounds are playing.
          for (var i=0; i<self._howls.length; i++) {
            if (self._howls[i]._webAudio) {
              for (var j=0; j<self._howls[i]._sounds.length; j++) {
                if (!self._howls[i]._sounds[j]._paused) {
                  return self;
                }
              }
            }
          }

          if (self._suspendTimer) {
            clearTimeout(self._suspendTimer);
          }

          // If no sound has played after 30 seconds, suspend the context.
          self._suspendTimer = setTimeout(function() {
            if (!self.autoSuspend) {
              return;
            }

            self._suspendTimer = null;
            self.state = 'suspending';
            self.ctx.suspend().then(function() {
              self.state = 'suspended';

              if (self._resumeAfterSuspend) {
                delete self._resumeAfterSuspend;
                self._autoResume();
              }
            });
          }, 30000);

          return self;
        },

        /**
         * Automatically resume the Web Audio AudioContext when a new sound is played.
         * @return {Howler}
         */
        _autoResume: function() {
          var self = this;

          if (!self.ctx || typeof self.ctx.resume === 'undefined' || !Howler.usingWebAudio) {
            return;
          }

          if (self.state === 'running' && self._suspendTimer) {
            clearTimeout(self._suspendTimer);
            self._suspendTimer = null;
          } else if (self.state === 'suspended') {
            self.ctx.resume().then(function() {
              self.state = 'running';

              // Emit to all Howls that the audio has resumed.
              for (var i=0; i<self._howls.length; i++) {
                self._howls[i]._emit('resume');
              }
            });

            if (self._suspendTimer) {
              clearTimeout(self._suspendTimer);
              self._suspendTimer = null;
            }
          } else if (self.state === 'suspending') {
            self._resumeAfterSuspend = true;
          }

          return self;
        }
      };

      // Setup the global audio controller.
      var Howler = new HowlerGlobal();

      /** Group Methods **/
      /***************************************************************************/

      /**
       * Create an audio group controller.
       * @param {Object} o Passed in properties for this group.
       */
      var Howl = function(o) {
        var self = this;

        // Throw an error if no source is provided.
        if (!o.src || o.src.length === 0) {
          console.error('An array of source files must be passed with any new Howl.');
          return;
        }

        self.init(o);
      };
      Howl.prototype = {
        /**
         * Initialize a new Howl group object.
         * @param  {Object} o Passed in properties for this group.
         * @return {Howl}
         */
        init: function(o) {
          var self = this;

          // If we don't have an AudioContext created yet, run the setup.
          if (!Howler.ctx) {
            setupAudioContext();
          }

          // Setup user-defined default properties.
          self._autoplay = o.autoplay || false;
          self._format = (typeof o.format !== 'string') ? o.format : [o.format];
          self._html5 = o.html5 || false;
          self._muted = o.mute || false;
          self._loop = o.loop || false;
          self._pool = o.pool || 5;
          self._preload = (typeof o.preload === 'boolean') ? o.preload : true;
          self._rate = o.rate || 1;
          self._sprite = o.sprite || {};
          self._src = (typeof o.src !== 'string') ? o.src : [o.src];
          self._volume = o.volume !== undefined ? o.volume : 1;
          self._xhrWithCredentials = o.xhrWithCredentials || false;

          // Setup all other default properties.
          self._duration = 0;
          self._state = 'unloaded';
          self._sounds = [];
          self._endTimers = {};
          self._queue = [];
          self._playLock = false;

          // Setup event listeners.
          self._onend = o.onend ? [{fn: o.onend}] : [];
          self._onfade = o.onfade ? [{fn: o.onfade}] : [];
          self._onload = o.onload ? [{fn: o.onload}] : [];
          self._onloaderror = o.onloaderror ? [{fn: o.onloaderror}] : [];
          self._onplayerror = o.onplayerror ? [{fn: o.onplayerror}] : [];
          self._onpause = o.onpause ? [{fn: o.onpause}] : [];
          self._onplay = o.onplay ? [{fn: o.onplay}] : [];
          self._onstop = o.onstop ? [{fn: o.onstop}] : [];
          self._onmute = o.onmute ? [{fn: o.onmute}] : [];
          self._onvolume = o.onvolume ? [{fn: o.onvolume}] : [];
          self._onrate = o.onrate ? [{fn: o.onrate}] : [];
          self._onseek = o.onseek ? [{fn: o.onseek}] : [];
          self._onunlock = o.onunlock ? [{fn: o.onunlock}] : [];
          self._onresume = [];

          // Web Audio or HTML5 Audio?
          self._webAudio = Howler.usingWebAudio && !self._html5;

          // Automatically try to enable audio.
          if (typeof Howler.ctx !== 'undefined' && Howler.ctx && Howler.autoUnlock) {
            Howler._unlockAudio();
          }

          // Keep track of this Howl group in the global controller.
          Howler._howls.push(self);

          // If they selected autoplay, add a play event to the load queue.
          if (self._autoplay) {
            self._queue.push({
              event: 'play',
              action: function() {
                self.play();
              }
            });
          }

          // Load the source file unless otherwise specified.
          if (self._preload) {
            self.load();
          }

          return self;
        },

        /**
         * Load the audio file.
         * @return {Howler}
         */
        load: function() {
          var self = this;
          var url = null;

          // If no audio is available, quit immediately.
          if (Howler.noAudio) {
            self._emit('loaderror', null, 'No audio support.');
            return;
          }

          // Make sure our source is in an array.
          if (typeof self._src === 'string') {
            self._src = [self._src];
          }

          // Loop through the sources and pick the first one that is compatible.
          for (var i=0; i<self._src.length; i++) {
            var ext, str;

            if (self._format && self._format[i]) {
              // If an extension was specified, use that instead.
              ext = self._format[i];
            } else {
              // Make sure the source is a string.
              str = self._src[i];
              if (typeof str !== 'string') {
                self._emit('loaderror', null, 'Non-string found in selected audio sources - ignoring.');
                continue;
              }

              // Extract the file extension from the URL or base64 data URI.
              ext = /^data:audio\/([^;,]+);/i.exec(str);
              if (!ext) {
                ext = /\.([^.]+)$/.exec(str.split('?', 1)[0]);
              }

              if (ext) {
                ext = ext[1].toLowerCase();
              }
            }

            // Log a warning if no extension was found.
            if (!ext) {
              console.warn('No file extension was found. Consider using the "format" property or specify an extension.');
            }

            // Check if this extension is available.
            if (ext && Howler.codecs(ext)) {
              url = self._src[i];
              break;
            }
          }

          if (!url) {
            self._emit('loaderror', null, 'No codec support for selected audio sources.');
            return;
          }

          self._src = url;
          self._state = 'loading';

          // If the hosting page is HTTPS and the source isn't,
          // drop down to HTML5 Audio to avoid Mixed Content errors.
          if (window.location.protocol === 'https:' && url.slice(0, 5) === 'http:') {
            self._html5 = true;
            self._webAudio = false;
          }

          // Create a new sound object and add it to the pool.
          new Sound(self);

          // Load and decode the audio data for playback.
          if (self._webAudio) {
            loadBuffer(self);
          }

          return self;
        },

        /**
         * Play a sound or resume previous playback.
         * @param  {String/Number} sprite   Sprite name for sprite playback or sound id to continue previous.
         * @param  {Boolean} internal Internal Use: true prevents event firing.
         * @return {Number}          Sound ID.
         */
        play: function(sprite, internal) {
          var self = this;
          var id = null;

          // Determine if a sprite, sound id or nothing was passed
          if (typeof sprite === 'number') {
            id = sprite;
            sprite = null;
          } else if (typeof sprite === 'string' && self._state === 'loaded' && !self._sprite[sprite]) {
            // If the passed sprite doesn't exist, do nothing.
            return null;
          } else if (typeof sprite === 'undefined') {
            // Use the default sound sprite (plays the full audio length).
            sprite = '__default';

            // Check if there is a single paused sound that isn't ended. 
            // If there is, play that sound. If not, continue as usual.  
            if (!self._playLock) {
              var num = 0;
              for (var i=0; i<self._sounds.length; i++) {
                if (self._sounds[i]._paused && !self._sounds[i]._ended) {
                  num++;
                  id = self._sounds[i]._id;
                }
              }

              if (num === 1) {
                sprite = null;
              } else {
                id = null;
              }
            }
          }

          // Get the selected node, or get one from the pool.
          var sound = id ? self._soundById(id) : self._inactiveSound();

          // If the sound doesn't exist, do nothing.
          if (!sound) {
            return null;
          }

          // Select the sprite definition.
          if (id && !sprite) {
            sprite = sound._sprite || '__default';
          }

          // If the sound hasn't loaded, we must wait to get the audio's duration.
          // We also need to wait to make sure we don't run into race conditions with
          // the order of function calls.
          if (self._state !== 'loaded') {
            // Set the sprite value on this sound.
            sound._sprite = sprite;

            // Mark this sound as not ended in case another sound is played before this one loads.
            sound._ended = false;

            // Add the sound to the queue to be played on load.
            var soundId = sound._id;
            self._queue.push({
              event: 'play',
              action: function() {
                self.play(soundId);
              }
            });

            return soundId;
          }

          // Don't play the sound if an id was passed and it is already playing.
          if (id && !sound._paused) {
            // Trigger the play event, in order to keep iterating through queue.
            if (!internal) {
              self._loadQueue('play');
            }

            return sound._id;
          }

          // Make sure the AudioContext isn't suspended, and resume it if it is.
          if (self._webAudio) {
            Howler._autoResume();
          }

          // Determine how long to play for and where to start playing.
          var seek = Math.max(0, sound._seek > 0 ? sound._seek : self._sprite[sprite][0] / 1000);
          var duration = Math.max(0, ((self._sprite[sprite][0] + self._sprite[sprite][1]) / 1000) - seek);
          var timeout = (duration * 1000) / Math.abs(sound._rate);
          var start = self._sprite[sprite][0] / 1000;
          var stop = (self._sprite[sprite][0] + self._sprite[sprite][1]) / 1000;
          sound._sprite = sprite;

          // Mark the sound as ended instantly so that this async playback
          // doesn't get grabbed by another call to play while this one waits to start.
          sound._ended = false;

          // Update the parameters of the sound.
          var setParams = function() {
            sound._paused = false;
            sound._seek = seek;
            sound._start = start;
            sound._stop = stop;
            sound._loop = !!(sound._loop || self._sprite[sprite][2]);
          };

          // End the sound instantly if seek is at the end.
          if (seek >= stop) {
            self._ended(sound);
            return;
          }

          // Begin the actual playback.
          var node = sound._node;
          if (self._webAudio) {
            // Fire this when the sound is ready to play to begin Web Audio playback.
            var playWebAudio = function() {
              self._playLock = false;
              setParams();
              self._refreshBuffer(sound);

              // Setup the playback params.
              var vol = (sound._muted || self._muted) ? 0 : sound._volume;
              node.gain.setValueAtTime(vol, Howler.ctx.currentTime);
              sound._playStart = Howler.ctx.currentTime;

              // Play the sound using the supported method.
              if (typeof node.bufferSource.start === 'undefined') {
                sound._loop ? node.bufferSource.noteGrainOn(0, seek, 86400) : node.bufferSource.noteGrainOn(0, seek, duration);
              } else {
                sound._loop ? node.bufferSource.start(0, seek, 86400) : node.bufferSource.start(0, seek, duration);
              }

              // Start a new timer if none is present.
              if (timeout !== Infinity) {
                self._endTimers[sound._id] = setTimeout(self._ended.bind(self, sound), timeout);
              }

              if (!internal) {
                setTimeout(function() {
                  self._emit('play', sound._id);
                  self._loadQueue();
                }, 0);
              }
            };

            if (Howler.state === 'running') {
              playWebAudio();
            } else {
              self._playLock = true;

              // Wait for the audio context to resume before playing.
              self.once('resume', playWebAudio);

              // Cancel the end timer.
              self._clearTimer(sound._id);
            }
          } else {
            // Fire this when the sound is ready to play to begin HTML5 Audio playback.
            var playHtml5 = function() {
              node.currentTime = seek;
              node.muted = sound._muted || self._muted || Howler._muted || node.muted;
              node.volume = sound._volume * Howler.volume();
              node.playbackRate = sound._rate;

              // Some browsers will throw an error if this is called without user interaction.
              try {
                var play = node.play();

                // Support older browsers that don't support promises, and thus don't have this issue.
                if (play && typeof Promise !== 'undefined' && (play instanceof Promise || typeof play.then === 'function')) {
                  // Implements a lock to prevent DOMException: The play() request was interrupted by a call to pause().
                  self._playLock = true;

                  // Set param values immediately.
                  setParams();

                  // Releases the lock and executes queued actions.
                  play
                    .then(function() {
                      self._playLock = false;
                      node._unlocked = true;
                      if (!internal) {
                        self._emit('play', sound._id);
                        self._loadQueue();
                      }
                    })
                    .catch(function() {
                      self._playLock = false;
                      self._emit('playerror', sound._id, 'Playback was unable to start. This is most commonly an issue ' +
                        'on mobile devices and Chrome where playback was not within a user interaction.');

                      // Reset the ended and paused values.
                      sound._ended = true;
                      sound._paused = true;
                    });
                } else if (!internal) {
                  self._playLock = false;
                  setParams();
                  self._emit('play', sound._id);
                  self._loadQueue();
                }

                // Setting rate before playing won't work in IE, so we set it again here.
                node.playbackRate = sound._rate;

                // If the node is still paused, then we can assume there was a playback issue.
                if (node.paused) {
                  self._emit('playerror', sound._id, 'Playback was unable to start. This is most commonly an issue ' +
                    'on mobile devices and Chrome where playback was not within a user interaction.');
                  return;
                }

                // Setup the end timer on sprites or listen for the ended event.
                if (sprite !== '__default' || sound._loop) {
                  self._endTimers[sound._id] = setTimeout(self._ended.bind(self, sound), timeout);
                } else {
                  self._endTimers[sound._id] = function() {
                    // Fire ended on this audio node.
                    self._ended(sound);

                    // Clear this listener.
                    node.removeEventListener('ended', self._endTimers[sound._id], false);
                  };
                  node.addEventListener('ended', self._endTimers[sound._id], false);
                }
              } catch (err) {
                self._emit('playerror', sound._id, err);
              }
            };

            // If this is streaming audio, make sure the src is set and load again.
            if (node.src === 'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA') {
              node.src = self._src;
              node.load();
            }

            // Play immediately if ready, or wait for the 'canplaythrough'e vent.
            var loadedNoReadyState = (window && window.ejecta) || (!node.readyState && Howler._navigator.isCocoonJS);
            if (node.readyState >= 3 || loadedNoReadyState) {
              playHtml5();
            } else {
              self._playLock = true;

              var listener = function() {
                // Begin playback.
                playHtml5();

                // Clear this listener.
                node.removeEventListener(Howler._canPlayEvent, listener, false);
              };
              node.addEventListener(Howler._canPlayEvent, listener, false);

              // Cancel the end timer.
              self._clearTimer(sound._id);
            }
          }

          return sound._id;
        },

        /**
         * Pause playback and save current position.
         * @param  {Number} id The sound ID (empty to pause all in group).
         * @return {Howl}
         */
        pause: function(id) {
          var self = this;

          // If the sound hasn't loaded or a play() promise is pending, add it to the load queue to pause when capable.
          if (self._state !== 'loaded' || self._playLock) {
            self._queue.push({
              event: 'pause',
              action: function() {
                self.pause(id);
              }
            });

            return self;
          }

          // If no id is passed, get all ID's to be paused.
          var ids = self._getSoundIds(id);

          for (var i=0; i<ids.length; i++) {
            // Clear the end timer.
            self._clearTimer(ids[i]);

            // Get the sound.
            var sound = self._soundById(ids[i]);

            if (sound && !sound._paused) {
              // Reset the seek position.
              sound._seek = self.seek(ids[i]);
              sound._rateSeek = 0;
              sound._paused = true;

              // Stop currently running fades.
              self._stopFade(ids[i]);

              if (sound._node) {
                if (self._webAudio) {
                  // Make sure the sound has been created.
                  if (!sound._node.bufferSource) {
                    continue;
                  }

                  if (typeof sound._node.bufferSource.stop === 'undefined') {
                    sound._node.bufferSource.noteOff(0);
                  } else {
                    sound._node.bufferSource.stop(0);
                  }

                  // Clean up the buffer source.
                  self._cleanBuffer(sound._node);
                } else if (!isNaN(sound._node.duration) || sound._node.duration === Infinity) {
                  sound._node.pause();
                }
              }
            }

            // Fire the pause event, unless `true` is passed as the 2nd argument.
            if (!arguments[1]) {
              self._emit('pause', sound ? sound._id : null);
            }
          }

          return self;
        },

        /**
         * Stop playback and reset to start.
         * @param  {Number} id The sound ID (empty to stop all in group).
         * @param  {Boolean} internal Internal Use: true prevents event firing.
         * @return {Howl}
         */
        stop: function(id, internal) {
          var self = this;

          // If the sound hasn't loaded, add it to the load queue to stop when capable.
          if (self._state !== 'loaded' || self._playLock) {
            self._queue.push({
              event: 'stop',
              action: function() {
                self.stop(id);
              }
            });

            return self;
          }

          // If no id is passed, get all ID's to be stopped.
          var ids = self._getSoundIds(id);

          for (var i=0; i<ids.length; i++) {
            // Clear the end timer.
            self._clearTimer(ids[i]);

            // Get the sound.
            var sound = self._soundById(ids[i]);

            if (sound) {
              // Reset the seek position.
              sound._seek = sound._start || 0;
              sound._rateSeek = 0;
              sound._paused = true;
              sound._ended = true;

              // Stop currently running fades.
              self._stopFade(ids[i]);

              if (sound._node) {
                if (self._webAudio) {
                  // Make sure the sound's AudioBufferSourceNode has been created.
                  if (sound._node.bufferSource) {
                    if (typeof sound._node.bufferSource.stop === 'undefined') {
                      sound._node.bufferSource.noteOff(0);
                    } else {
                      sound._node.bufferSource.stop(0);
                    }

                    // Clean up the buffer source.
                    self._cleanBuffer(sound._node);
                  }
                } else if (!isNaN(sound._node.duration) || sound._node.duration === Infinity) {
                  sound._node.currentTime = sound._start || 0;
                  sound._node.pause();

                  // If this is a live stream, stop download once the audio is stopped.
                  if (sound._node.duration === Infinity) {
                    self._clearSound(sound._node);
                  }
                }
              }

              if (!internal) {
                self._emit('stop', sound._id);
              }
            }
          }

          return self;
        },

        /**
         * Mute/unmute a single sound or all sounds in this Howl group.
         * @param  {Boolean} muted Set to true to mute and false to unmute.
         * @param  {Number} id    The sound ID to update (omit to mute/unmute all).
         * @return {Howl}
         */
        mute: function(muted, id) {
          var self = this;

          // If the sound hasn't loaded, add it to the load queue to mute when capable.
          if (self._state !== 'loaded'|| self._playLock) {
            self._queue.push({
              event: 'mute',
              action: function() {
                self.mute(muted, id);
              }
            });

            return self;
          }

          // If applying mute/unmute to all sounds, update the group's value.
          if (typeof id === 'undefined') {
            if (typeof muted === 'boolean') {
              self._muted = muted;
            } else {
              return self._muted;
            }
          }

          // If no id is passed, get all ID's to be muted.
          var ids = self._getSoundIds(id);

          for (var i=0; i<ids.length; i++) {
            // Get the sound.
            var sound = self._soundById(ids[i]);

            if (sound) {
              sound._muted = muted;

              // Cancel active fade and set the volume to the end value.
              if (sound._interval) {
                self._stopFade(sound._id);
              }

              if (self._webAudio && sound._node) {
                sound._node.gain.setValueAtTime(muted ? 0 : sound._volume, Howler.ctx.currentTime);
              } else if (sound._node) {
                sound._node.muted = Howler._muted ? true : muted;
              }

              self._emit('mute', sound._id);
            }
          }

          return self;
        },

        /**
         * Get/set the volume of this sound or of the Howl group. This method can optionally take 0, 1 or 2 arguments.
         *   volume() -> Returns the group's volume value.
         *   volume(id) -> Returns the sound id's current volume.
         *   volume(vol) -> Sets the volume of all sounds in this Howl group.
         *   volume(vol, id) -> Sets the volume of passed sound id.
         * @return {Howl/Number} Returns self or current volume.
         */
        volume: function() {
          var self = this;
          var args = arguments;
          var vol, id;

          // Determine the values based on arguments.
          if (args.length === 0) {
            // Return the value of the groups' volume.
            return self._volume;
          } else if (args.length === 1 || args.length === 2 && typeof args[1] === 'undefined') {
            // First check if this is an ID, and if not, assume it is a new volume.
            var ids = self._getSoundIds();
            var index = ids.indexOf(args[0]);
            if (index >= 0) {
              id = parseInt(args[0], 10);
            } else {
              vol = parseFloat(args[0]);
            }
          } else if (args.length >= 2) {
            vol = parseFloat(args[0]);
            id = parseInt(args[1], 10);
          }

          // Update the volume or return the current volume.
          var sound;
          if (typeof vol !== 'undefined' && vol >= 0 && vol <= 1) {
            // If the sound hasn't loaded, add it to the load queue to change volume when capable.
            if (self._state !== 'loaded'|| self._playLock) {
              self._queue.push({
                event: 'volume',
                action: function() {
                  self.volume.apply(self, args);
                }
              });

              return self;
            }

            // Set the group volume.
            if (typeof id === 'undefined') {
              self._volume = vol;
            }

            // Update one or all volumes.
            id = self._getSoundIds(id);
            for (var i=0; i<id.length; i++) {
              // Get the sound.
              sound = self._soundById(id[i]);

              if (sound) {
                sound._volume = vol;

                // Stop currently running fades.
                if (!args[2]) {
                  self._stopFade(id[i]);
                }

                if (self._webAudio && sound._node && !sound._muted) {
                  sound._node.gain.setValueAtTime(vol, Howler.ctx.currentTime);
                } else if (sound._node && !sound._muted) {
                  sound._node.volume = vol * Howler.volume();
                }

                self._emit('volume', sound._id);
              }
            }
          } else {
            sound = id ? self._soundById(id) : self._sounds[0];
            return sound ? sound._volume : 0;
          }

          return self;
        },

        /**
         * Fade a currently playing sound between two volumes (if no id is passed, all sounds will fade).
         * @param  {Number} from The value to fade from (0.0 to 1.0).
         * @param  {Number} to   The volume to fade to (0.0 to 1.0).
         * @param  {Number} len  Time in milliseconds to fade.
         * @param  {Number} id   The sound id (omit to fade all sounds).
         * @return {Howl}
         */
        fade: function(from, to, len, id) {
          var self = this;

          // If the sound hasn't loaded, add it to the load queue to fade when capable.
          if (self._state !== 'loaded' || self._playLock) {
            self._queue.push({
              event: 'fade',
              action: function() {
                self.fade(from, to, len, id);
              }
            });

            return self;
          }

          // Make sure the to/from/len values are numbers.
          from = parseFloat(from);
          to = parseFloat(to);
          len = parseFloat(len);

          // Set the volume to the start position.
          self.volume(from, id);

          // Fade the volume of one or all sounds.
          var ids = self._getSoundIds(id);
          for (var i=0; i<ids.length; i++) {
            // Get the sound.
            var sound = self._soundById(ids[i]);

            // Create a linear fade or fall back to timeouts with HTML5 Audio.
            if (sound) {
              // Stop the previous fade if no sprite is being used (otherwise, volume handles this).
              if (!id) {
                self._stopFade(ids[i]);
              }

              // If we are using Web Audio, let the native methods do the actual fade.
              if (self._webAudio && !sound._muted) {
                var currentTime = Howler.ctx.currentTime;
                var end = currentTime + (len / 1000);
                sound._volume = from;
                sound._node.gain.setValueAtTime(from, currentTime);
                sound._node.gain.linearRampToValueAtTime(to, end);
              }

              self._startFadeInterval(sound, from, to, len, ids[i], typeof id === 'undefined');
            }
          }

          return self;
        },

        /**
         * Starts the internal interval to fade a sound.
         * @param  {Object} sound Reference to sound to fade.
         * @param  {Number} from The value to fade from (0.0 to 1.0).
         * @param  {Number} to   The volume to fade to (0.0 to 1.0).
         * @param  {Number} len  Time in milliseconds to fade.
         * @param  {Number} id   The sound id to fade.
         * @param  {Boolean} isGroup   If true, set the volume on the group.
         */
        _startFadeInterval: function(sound, from, to, len, id, isGroup) {
          var self = this;
          var vol = from;
          var diff = to - from;
          var steps = Math.abs(diff / 0.01);
          var stepLen = Math.max(4, (steps > 0) ? len / steps : len);
          var lastTick = Date.now();

          // Store the value being faded to.
          sound._fadeTo = to;

          // Update the volume value on each interval tick.
          sound._interval = setInterval(function() {
            // Update the volume based on the time since the last tick.
            var tick = (Date.now() - lastTick) / len;
            lastTick = Date.now();
            vol += diff * tick;

            // Make sure the volume is in the right bounds.
            vol = Math.max(0, vol);
            vol = Math.min(1, vol);

            // Round to within 2 decimal points.
            vol = Math.round(vol * 100) / 100;

            // Change the volume.
            if (self._webAudio) {
              sound._volume = vol;
            } else {
              self.volume(vol, sound._id, true);
            }

            // Set the group's volume.
            if (isGroup) {
              self._volume = vol;
            }

            // When the fade is complete, stop it and fire event.
            if ((to < from && vol <= to) || (to > from && vol >= to)) {
              clearInterval(sound._interval);
              sound._interval = null;
              sound._fadeTo = null;
              self.volume(to, sound._id);
              self._emit('fade', sound._id);
            }
          }, stepLen);
        },

        /**
         * Internal method that stops the currently playing fade when
         * a new fade starts, volume is changed or the sound is stopped.
         * @param  {Number} id The sound id.
         * @return {Howl}
         */
        _stopFade: function(id) {
          var self = this;
          var sound = self._soundById(id);

          if (sound && sound._interval) {
            if (self._webAudio) {
              sound._node.gain.cancelScheduledValues(Howler.ctx.currentTime);
            }

            clearInterval(sound._interval);
            sound._interval = null;
            self.volume(sound._fadeTo, id);
            sound._fadeTo = null;
            self._emit('fade', id);
          }

          return self;
        },

        /**
         * Get/set the loop parameter on a sound. This method can optionally take 0, 1 or 2 arguments.
         *   loop() -> Returns the group's loop value.
         *   loop(id) -> Returns the sound id's loop value.
         *   loop(loop) -> Sets the loop value for all sounds in this Howl group.
         *   loop(loop, id) -> Sets the loop value of passed sound id.
         * @return {Howl/Boolean} Returns self or current loop value.
         */
        loop: function() {
          var self = this;
          var args = arguments;
          var loop, id, sound;

          // Determine the values for loop and id.
          if (args.length === 0) {
            // Return the grou's loop value.
            return self._loop;
          } else if (args.length === 1) {
            if (typeof args[0] === 'boolean') {
              loop = args[0];
              self._loop = loop;
            } else {
              // Return this sound's loop value.
              sound = self._soundById(parseInt(args[0], 10));
              return sound ? sound._loop : false;
            }
          } else if (args.length === 2) {
            loop = args[0];
            id = parseInt(args[1], 10);
          }

          // If no id is passed, get all ID's to be looped.
          var ids = self._getSoundIds(id);
          for (var i=0; i<ids.length; i++) {
            sound = self._soundById(ids[i]);

            if (sound) {
              sound._loop = loop;
              if (self._webAudio && sound._node && sound._node.bufferSource) {
                sound._node.bufferSource.loop = loop;
                if (loop) {
                  sound._node.bufferSource.loopStart = sound._start || 0;
                  sound._node.bufferSource.loopEnd = sound._stop;
                }
              }
            }
          }

          return self;
        },

        /**
         * Get/set the playback rate of a sound. This method can optionally take 0, 1 or 2 arguments.
         *   rate() -> Returns the first sound node's current playback rate.
         *   rate(id) -> Returns the sound id's current playback rate.
         *   rate(rate) -> Sets the playback rate of all sounds in this Howl group.
         *   rate(rate, id) -> Sets the playback rate of passed sound id.
         * @return {Howl/Number} Returns self or the current playback rate.
         */
        rate: function() {
          var self = this;
          var args = arguments;
          var rate, id;

          // Determine the values based on arguments.
          if (args.length === 0) {
            // We will simply return the current rate of the first node.
            id = self._sounds[0]._id;
          } else if (args.length === 1) {
            // First check if this is an ID, and if not, assume it is a new rate value.
            var ids = self._getSoundIds();
            var index = ids.indexOf(args[0]);
            if (index >= 0) {
              id = parseInt(args[0], 10);
            } else {
              rate = parseFloat(args[0]);
            }
          } else if (args.length === 2) {
            rate = parseFloat(args[0]);
            id = parseInt(args[1], 10);
          }

          // Update the playback rate or return the current value.
          var sound;
          if (typeof rate === 'number') {
            // If the sound hasn't loaded, add it to the load queue to change playback rate when capable.
            if (self._state !== 'loaded' || self._playLock) {
              self._queue.push({
                event: 'rate',
                action: function() {
                  self.rate.apply(self, args);
                }
              });

              return self;
            }

            // Set the group rate.
            if (typeof id === 'undefined') {
              self._rate = rate;
            }

            // Update one or all volumes.
            id = self._getSoundIds(id);
            for (var i=0; i<id.length; i++) {
              // Get the sound.
              sound = self._soundById(id[i]);

              if (sound) {
                // Keep track of our position when the rate changed and update the playback
                // start position so we can properly adjust the seek position for time elapsed.
                if (self.playing(id[i])) {
                  sound._rateSeek = self.seek(id[i]);
                  sound._playStart = self._webAudio ? Howler.ctx.currentTime : sound._playStart;
                }
                sound._rate = rate;

                // Change the playback rate.
                if (self._webAudio && sound._node && sound._node.bufferSource) {
                  sound._node.bufferSource.playbackRate.setValueAtTime(rate, Howler.ctx.currentTime);
                } else if (sound._node) {
                  sound._node.playbackRate = rate;
                }

                // Reset the timers.
                var seek = self.seek(id[i]);
                var duration = ((self._sprite[sound._sprite][0] + self._sprite[sound._sprite][1]) / 1000) - seek;
                var timeout = (duration * 1000) / Math.abs(sound._rate);

                // Start a new end timer if sound is already playing.
                if (self._endTimers[id[i]] || !sound._paused) {
                  self._clearTimer(id[i]);
                  self._endTimers[id[i]] = setTimeout(self._ended.bind(self, sound), timeout);
                }

                self._emit('rate', sound._id);
              }
            }
          } else {
            sound = self._soundById(id);
            return sound ? sound._rate : self._rate;
          }

          return self;
        },

        /**
         * Get/set the seek position of a sound. This method can optionally take 0, 1 or 2 arguments.
         *   seek() -> Returns the first sound node's current seek position.
         *   seek(id) -> Returns the sound id's current seek position.
         *   seek(seek) -> Sets the seek position of the first sound node.
         *   seek(seek, id) -> Sets the seek position of passed sound id.
         * @return {Howl/Number} Returns self or the current seek position.
         */
        seek: function() {
          var self = this;
          var args = arguments;
          var seek, id;

          // Determine the values based on arguments.
          if (args.length === 0) {
            // We will simply return the current position of the first node.
            id = self._sounds[0]._id;
          } else if (args.length === 1) {
            // First check if this is an ID, and if not, assume it is a new seek position.
            var ids = self._getSoundIds();
            var index = ids.indexOf(args[0]);
            if (index >= 0) {
              id = parseInt(args[0], 10);
            } else if (self._sounds.length) {
              id = self._sounds[0]._id;
              seek = parseFloat(args[0]);
            }
          } else if (args.length === 2) {
            seek = parseFloat(args[0]);
            id = parseInt(args[1], 10);
          }

          // If there is no ID, bail out.
          if (typeof id === 'undefined') {
            return self;
          }

          // If the sound hasn't loaded, add it to the load queue to seek when capable.
          if (self._state !== 'loaded' || self._playLock) {
            self._queue.push({
              event: 'seek',
              action: function() {
                self.seek.apply(self, args);
              }
            });

            return self;
          }

          // Get the sound.
          var sound = self._soundById(id);

          if (sound) {
            if (typeof seek === 'number' && seek >= 0) {
              // Pause the sound and update position for restarting playback.
              var playing = self.playing(id);
              if (playing) {
                self.pause(id, true);
              }

              // Move the position of the track and cancel timer.
              sound._seek = seek;
              sound._ended = false;
              self._clearTimer(id);

              // Update the seek position for HTML5 Audio.
              if (!self._webAudio && sound._node && !isNaN(sound._node.duration)) {
                sound._node.currentTime = seek;
              }

              // Seek and emit when ready.
              var seekAndEmit = function() {
                self._emit('seek', id);

                // Restart the playback if the sound was playing.
                if (playing) {
                  self.play(id, true);
                }
              };

              // Wait for the play lock to be unset before emitting (HTML5 Audio).
              if (playing && !self._webAudio) {
                var emitSeek = function() {
                  if (!self._playLock) {
                    seekAndEmit();
                  } else {
                    setTimeout(emitSeek, 0);
                  }
                };
                setTimeout(emitSeek, 0);
              } else {
                seekAndEmit();
              }
            } else {
              if (self._webAudio) {
                var realTime = self.playing(id) ? Howler.ctx.currentTime - sound._playStart : 0;
                var rateSeek = sound._rateSeek ? sound._rateSeek - sound._seek : 0;
                return sound._seek + (rateSeek + realTime * Math.abs(sound._rate));
              } else {
                return sound._node.currentTime;
              }
            }
          }

          return self;
        },

        /**
         * Check if a specific sound is currently playing or not (if id is provided), or check if at least one of the sounds in the group is playing or not.
         * @param  {Number}  id The sound id to check. If none is passed, the whole sound group is checked.
         * @return {Boolean} True if playing and false if not.
         */
        playing: function(id) {
          var self = this;

          // Check the passed sound ID (if any).
          if (typeof id === 'number') {
            var sound = self._soundById(id);
            return sound ? !sound._paused : false;
          }

          // Otherwise, loop through all sounds and check if any are playing.
          for (var i=0; i<self._sounds.length; i++) {
            if (!self._sounds[i]._paused) {
              return true;
            }
          }

          return false;
        },

        /**
         * Get the duration of this sound. Passing a sound id will return the sprite duration.
         * @param  {Number} id The sound id to check. If none is passed, return full source duration.
         * @return {Number} Audio duration in seconds.
         */
        duration: function(id) {
          var self = this;
          var duration = self._duration;

          // If we pass an ID, get the sound and return the sprite length.
          var sound = self._soundById(id);
          if (sound) {
            duration = self._sprite[sound._sprite][1] / 1000;
          }

          return duration;
        },

        /**
         * Returns the current loaded state of this Howl.
         * @return {String} 'unloaded', 'loading', 'loaded'
         */
        state: function() {
          return this._state;
        },

        /**
         * Unload and destroy the current Howl object.
         * This will immediately stop all sound instances attached to this group.
         */
        unload: function() {
          var self = this;

          // Stop playing any active sounds.
          var sounds = self._sounds;
          for (var i=0; i<sounds.length; i++) {
            // Stop the sound if it is currently playing.
            if (!sounds[i]._paused) {
              self.stop(sounds[i]._id);
            }

            // Remove the source or disconnect.
            if (!self._webAudio) {
              // Set the source to 0-second silence to stop any downloading (except in IE).
              self._clearSound(sounds[i]._node);

              // Remove any event listeners.
              sounds[i]._node.removeEventListener('error', sounds[i]._errorFn, false);
              sounds[i]._node.removeEventListener(Howler._canPlayEvent, sounds[i]._loadFn, false);

              // Release the Audio object back to the pool.
              Howler._releaseHtml5Audio(sounds[i]._node);
            }

            // Empty out all of the nodes.
            delete sounds[i]._node;

            // Make sure all timers are cleared out.
            self._clearTimer(sounds[i]._id);
          }

          // Remove the references in the global Howler object.
          var index = Howler._howls.indexOf(self);
          if (index >= 0) {
            Howler._howls.splice(index, 1);
          }

          // Delete this sound from the cache (if no other Howl is using it).
          var remCache = true;
          for (i=0; i<Howler._howls.length; i++) {
            if (Howler._howls[i]._src === self._src || self._src.indexOf(Howler._howls[i]._src) >= 0) {
              remCache = false;
              break;
            }
          }

          if (cache && remCache) {
            delete cache[self._src];
          }

          // Clear global errors.
          Howler.noAudio = false;

          // Clear out `self`.
          self._state = 'unloaded';
          self._sounds = [];
          self = null;

          return null;
        },

        /**
         * Listen to a custom event.
         * @param  {String}   event Event name.
         * @param  {Function} fn    Listener to call.
         * @param  {Number}   id    (optional) Only listen to events for this sound.
         * @param  {Number}   once  (INTERNAL) Marks event to fire only once.
         * @return {Howl}
         */
        on: function(event, fn, id, once) {
          var self = this;
          var events = self['_on' + event];

          if (typeof fn === 'function') {
            events.push(once ? {id: id, fn: fn, once: once} : {id: id, fn: fn});
          }

          return self;
        },

        /**
         * Remove a custom event. Call without parameters to remove all events.
         * @param  {String}   event Event name.
         * @param  {Function} fn    Listener to remove. Leave empty to remove all.
         * @param  {Number}   id    (optional) Only remove events for this sound.
         * @return {Howl}
         */
        off: function(event, fn, id) {
          var self = this;
          var events = self['_on' + event];
          var i = 0;

          // Allow passing just an event and ID.
          if (typeof fn === 'number') {
            id = fn;
            fn = null;
          }

          if (fn || id) {
            // Loop through event store and remove the passed function.
            for (i=0; i<events.length; i++) {
              var isId = (id === events[i].id);
              if (fn === events[i].fn && isId || !fn && isId) {
                events.splice(i, 1);
                break;
              }
            }
          } else if (event) {
            // Clear out all events of this type.
            self['_on' + event] = [];
          } else {
            // Clear out all events of every type.
            var keys = Object.keys(self);
            for (i=0; i<keys.length; i++) {
              if ((keys[i].indexOf('_on') === 0) && Array.isArray(self[keys[i]])) {
                self[keys[i]] = [];
              }
            }
          }

          return self;
        },

        /**
         * Listen to a custom event and remove it once fired.
         * @param  {String}   event Event name.
         * @param  {Function} fn    Listener to call.
         * @param  {Number}   id    (optional) Only listen to events for this sound.
         * @return {Howl}
         */
        once: function(event, fn, id) {
          var self = this;

          // Setup the event listener.
          self.on(event, fn, id, 1);

          return self;
        },

        /**
         * Emit all events of a specific type and pass the sound id.
         * @param  {String} event Event name.
         * @param  {Number} id    Sound ID.
         * @param  {Number} msg   Message to go with event.
         * @return {Howl}
         */
        _emit: function(event, id, msg) {
          var self = this;
          var events = self['_on' + event];

          // Loop through event store and fire all functions.
          for (var i=events.length-1; i>=0; i--) {
            // Only fire the listener if the correct ID is used.
            if (!events[i].id || events[i].id === id || event === 'load') {
              setTimeout(function(fn) {
                fn.call(this, id, msg);
              }.bind(self, events[i].fn), 0);

              // If this event was setup with `once`, remove it.
              if (events[i].once) {
                self.off(event, events[i].fn, events[i].id);
              }
            }
          }

          // Pass the event type into load queue so that it can continue stepping.
          self._loadQueue(event);

          return self;
        },

        /**
         * Queue of actions initiated before the sound has loaded.
         * These will be called in sequence, with the next only firing
         * after the previous has finished executing (even if async like play).
         * @return {Howl}
         */
        _loadQueue: function(event) {
          var self = this;

          if (self._queue.length > 0) {
            var task = self._queue[0];

            // Remove this task if a matching event was passed.
            if (task.event === event) {
              self._queue.shift();
              self._loadQueue();
            }

            // Run the task if no event type is passed.
            if (!event) {
              task.action();
            }
          }

          return self;
        },

        /**
         * Fired when playback ends at the end of the duration.
         * @param  {Sound} sound The sound object to work with.
         * @return {Howl}
         */
        _ended: function(sound) {
          var self = this;
          var sprite = sound._sprite;

          // If we are using IE and there was network latency we may be clipping
          // audio before it completes playing. Lets check the node to make sure it
          // believes it has completed, before ending the playback.
          if (!self._webAudio && sound._node && !sound._node.paused && !sound._node.ended && sound._node.currentTime < sound._stop) {
            setTimeout(self._ended.bind(self, sound), 100);
            return self;
          }

          // Should this sound loop?
          var loop = !!(sound._loop || self._sprite[sprite][2]);

          // Fire the ended event.
          self._emit('end', sound._id);

          // Restart the playback for HTML5 Audio loop.
          if (!self._webAudio && loop) {
            self.stop(sound._id, true).play(sound._id);
          }

          // Restart this timer if on a Web Audio loop.
          if (self._webAudio && loop) {
            self._emit('play', sound._id);
            sound._seek = sound._start || 0;
            sound._rateSeek = 0;
            sound._playStart = Howler.ctx.currentTime;

            var timeout = ((sound._stop - sound._start) * 1000) / Math.abs(sound._rate);
            self._endTimers[sound._id] = setTimeout(self._ended.bind(self, sound), timeout);
          }

          // Mark the node as paused.
          if (self._webAudio && !loop) {
            sound._paused = true;
            sound._ended = true;
            sound._seek = sound._start || 0;
            sound._rateSeek = 0;
            self._clearTimer(sound._id);

            // Clean up the buffer source.
            self._cleanBuffer(sound._node);

            // Attempt to auto-suspend AudioContext if no sounds are still playing.
            Howler._autoSuspend();
          }

          // When using a sprite, end the track.
          if (!self._webAudio && !loop) {
            self.stop(sound._id, true);
          }

          return self;
        },

        /**
         * Clear the end timer for a sound playback.
         * @param  {Number} id The sound ID.
         * @return {Howl}
         */
        _clearTimer: function(id) {
          var self = this;

          if (self._endTimers[id]) {
            // Clear the timeout or remove the ended listener.
            if (typeof self._endTimers[id] !== 'function') {
              clearTimeout(self._endTimers[id]);
            } else {
              var sound = self._soundById(id);
              if (sound && sound._node) {
                sound._node.removeEventListener('ended', self._endTimers[id], false);
              }
            }

            delete self._endTimers[id];
          }

          return self;
        },

        /**
         * Return the sound identified by this ID, or return null.
         * @param  {Number} id Sound ID
         * @return {Object}    Sound object or null.
         */
        _soundById: function(id) {
          var self = this;

          // Loop through all sounds and find the one with this ID.
          for (var i=0; i<self._sounds.length; i++) {
            if (id === self._sounds[i]._id) {
              return self._sounds[i];
            }
          }

          return null;
        },

        /**
         * Return an inactive sound from the pool or create a new one.
         * @return {Sound} Sound playback object.
         */
        _inactiveSound: function() {
          var self = this;

          self._drain();

          // Find the first inactive node to recycle.
          for (var i=0; i<self._sounds.length; i++) {
            if (self._sounds[i]._ended) {
              return self._sounds[i].reset();
            }
          }

          // If no inactive node was found, create a new one.
          return new Sound(self);
        },

        /**
         * Drain excess inactive sounds from the pool.
         */
        _drain: function() {
          var self = this;
          var limit = self._pool;
          var cnt = 0;
          var i = 0;

          // If there are less sounds than the max pool size, we are done.
          if (self._sounds.length < limit) {
            return;
          }

          // Count the number of inactive sounds.
          for (i=0; i<self._sounds.length; i++) {
            if (self._sounds[i]._ended) {
              cnt++;
            }
          }

          // Remove excess inactive sounds, going in reverse order.
          for (i=self._sounds.length - 1; i>=0; i--) {
            if (cnt <= limit) {
              return;
            }

            if (self._sounds[i]._ended) {
              // Disconnect the audio source when using Web Audio.
              if (self._webAudio && self._sounds[i]._node) {
                self._sounds[i]._node.disconnect(0);
              }

              // Remove sounds until we have the pool size.
              self._sounds.splice(i, 1);
              cnt--;
            }
          }
        },

        /**
         * Get all ID's from the sounds pool.
         * @param  {Number} id Only return one ID if one is passed.
         * @return {Array}    Array of IDs.
         */
        _getSoundIds: function(id) {
          var self = this;

          if (typeof id === 'undefined') {
            var ids = [];
            for (var i=0; i<self._sounds.length; i++) {
              ids.push(self._sounds[i]._id);
            }

            return ids;
          } else {
            return [id];
          }
        },

        /**
         * Load the sound back into the buffer source.
         * @param  {Sound} sound The sound object to work with.
         * @return {Howl}
         */
        _refreshBuffer: function(sound) {
          var self = this;

          // Setup the buffer source for playback.
          sound._node.bufferSource = Howler.ctx.createBufferSource();
          sound._node.bufferSource.buffer = cache[self._src];

          // Connect to the correct node.
          if (sound._panner) {
            sound._node.bufferSource.connect(sound._panner);
          } else {
            sound._node.bufferSource.connect(sound._node);
          }

          // Setup looping and playback rate.
          sound._node.bufferSource.loop = sound._loop;
          if (sound._loop) {
            sound._node.bufferSource.loopStart = sound._start || 0;
            sound._node.bufferSource.loopEnd = sound._stop || 0;
          }
          sound._node.bufferSource.playbackRate.setValueAtTime(sound._rate, Howler.ctx.currentTime);

          return self;
        },

        /**
         * Prevent memory leaks by cleaning up the buffer source after playback.
         * @param  {Object} node Sound's audio node containing the buffer source.
         * @return {Howl}
         */
        _cleanBuffer: function(node) {
          var self = this;
          var isIOS = Howler._navigator && Howler._navigator.vendor.indexOf('Apple') >= 0;

          if (Howler._scratchBuffer && node.bufferSource) {
            node.bufferSource.onended = null;
            node.bufferSource.disconnect(0);
            if (isIOS) {
              try { node.bufferSource.buffer = Howler._scratchBuffer; } catch(e) {}
            }
          }
          node.bufferSource = null;

          return self;
        },

        /**
         * Set the source to a 0-second silence to stop any downloading (except in IE).
         * @param  {Object} node Audio node to clear.
         */
        _clearSound: function(node) {
          var checkIE = /MSIE |Trident\//.test(Howler._navigator && Howler._navigator.userAgent);
          if (!checkIE) {
            node.src = 'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA';
          }
        }
      };

      /** Single Sound Methods **/
      /***************************************************************************/

      /**
       * Setup the sound object, which each node attached to a Howl group is contained in.
       * @param {Object} howl The Howl parent group.
       */
      var Sound = function(howl) {
        this._parent = howl;
        this.init();
      };
      Sound.prototype = {
        /**
         * Initialize a new Sound object.
         * @return {Sound}
         */
        init: function() {
          var self = this;
          var parent = self._parent;

          // Setup the default parameters.
          self._muted = parent._muted;
          self._loop = parent._loop;
          self._volume = parent._volume;
          self._rate = parent._rate;
          self._seek = 0;
          self._paused = true;
          self._ended = true;
          self._sprite = '__default';

          // Generate a unique ID for this sound.
          self._id = ++Howler._counter;

          // Add itself to the parent's pool.
          parent._sounds.push(self);

          // Create the new node.
          self.create();

          return self;
        },

        /**
         * Create and setup a new sound object, whether HTML5 Audio or Web Audio.
         * @return {Sound}
         */
        create: function() {
          var self = this;
          var parent = self._parent;
          var volume = (Howler._muted || self._muted || self._parent._muted) ? 0 : self._volume;

          if (parent._webAudio) {
            // Create the gain node for controlling volume (the source will connect to this).
            self._node = (typeof Howler.ctx.createGain === 'undefined') ? Howler.ctx.createGainNode() : Howler.ctx.createGain();
            self._node.gain.setValueAtTime(volume, Howler.ctx.currentTime);
            self._node.paused = true;
            self._node.connect(Howler.masterGain);
          } else if (!Howler.noAudio) {
            // Get an unlocked Audio object from the pool.
            self._node = Howler._obtainHtml5Audio();

            // Listen for errors (http://dev.w3.org/html5/spec-author-view/spec.html#mediaerror).
            self._errorFn = self._errorListener.bind(self);
            self._node.addEventListener('error', self._errorFn, false);

            // Listen for 'canplaythrough' event to let us know the sound is ready.
            self._loadFn = self._loadListener.bind(self);
            self._node.addEventListener(Howler._canPlayEvent, self._loadFn, false);

            // Setup the new audio node.
            self._node.src = parent._src;
            self._node.preload = 'auto';
            self._node.volume = volume * Howler.volume();

            // Begin loading the source.
            self._node.load();
          }

          return self;
        },

        /**
         * Reset the parameters of this sound to the original state (for recycle).
         * @return {Sound}
         */
        reset: function() {
          var self = this;
          var parent = self._parent;

          // Reset all of the parameters of this sound.
          self._muted = parent._muted;
          self._loop = parent._loop;
          self._volume = parent._volume;
          self._rate = parent._rate;
          self._seek = 0;
          self._rateSeek = 0;
          self._paused = true;
          self._ended = true;
          self._sprite = '__default';

          // Generate a new ID so that it isn't confused with the previous sound.
          self._id = ++Howler._counter;

          return self;
        },

        /**
         * HTML5 Audio error listener callback.
         */
        _errorListener: function() {
          var self = this;

          // Fire an error event and pass back the code.
          self._parent._emit('loaderror', self._id, self._node.error ? self._node.error.code : 0);

          // Clear the event listener.
          self._node.removeEventListener('error', self._errorFn, false);
        },

        /**
         * HTML5 Audio canplaythrough listener callback.
         */
        _loadListener: function() {
          var self = this;
          var parent = self._parent;

          // Round up the duration to account for the lower precision in HTML5 Audio.
          parent._duration = Math.ceil(self._node.duration * 10) / 10;

          // Setup a sprite if none is defined.
          if (Object.keys(parent._sprite).length === 0) {
            parent._sprite = {__default: [0, parent._duration * 1000]};
          }

          if (parent._state !== 'loaded') {
            parent._state = 'loaded';
            parent._emit('load');
            parent._loadQueue();
          }

          // Clear the event listener.
          self._node.removeEventListener(Howler._canPlayEvent, self._loadFn, false);
        }
      };

      /** Helper Methods **/
      /***************************************************************************/

      var cache = {};

      /**
       * Buffer a sound from URL, Data URI or cache and decode to audio source (Web Audio API).
       * @param  {Howl} self
       */
      var loadBuffer = function(self) {
        var url = self._src;

        // Check if the buffer has already been cached and use it instead.
        if (cache[url]) {
          // Set the duration from the cache.
          self._duration = cache[url].duration;

          // Load the sound into this Howl.
          loadSound(self);

          return;
        }

        if (/^data:[^;]+;base64,/.test(url)) {
          // Decode the base64 data URI without XHR, since some browsers don't support it.
          var data = atob(url.split(',')[1]);
          var dataView = new Uint8Array(data.length);
          for (var i=0; i<data.length; ++i) {
            dataView[i] = data.charCodeAt(i);
          }

          decodeAudioData(dataView.buffer, self);
        } else {
          // Load the buffer from the URL.
          var xhr = new XMLHttpRequest();
          xhr.open('GET', url, true);
          xhr.withCredentials = self._xhrWithCredentials;
          xhr.responseType = 'arraybuffer';
          xhr.onload = function() {
            // Make sure we get a successful response back.
            var code = (xhr.status + '')[0];
            if (code !== '0' && code !== '2' && code !== '3') {
              self._emit('loaderror', null, 'Failed loading audio file with status: ' + xhr.status + '.');
              return;
            }

            decodeAudioData(xhr.response, self);
          };
          xhr.onerror = function() {
            // If there is an error, switch to HTML5 Audio.
            if (self._webAudio) {
              self._html5 = true;
              self._webAudio = false;
              self._sounds = [];
              delete cache[url];
              self.load();
            }
          };
          safeXhrSend(xhr);
        }
      };

      /**
       * Send the XHR request wrapped in a try/catch.
       * @param  {Object} xhr XHR to send.
       */
      var safeXhrSend = function(xhr) {
        try {
          xhr.send();
        } catch (e) {
          xhr.onerror();
        }
      };

      /**
       * Decode audio data from an array buffer.
       * @param  {ArrayBuffer} arraybuffer The audio data.
       * @param  {Howl}        self
       */
      var decodeAudioData = function(arraybuffer, self) {
        // Fire a load error if something broke.
        var error = function() {
          self._emit('loaderror', null, 'Decoding audio data failed.');
        };

        // Load the sound on success.
        var success = function(buffer) {
          if (buffer && self._sounds.length > 0) {
            cache[self._src] = buffer;
            loadSound(self, buffer);
          } else {
            error();
          }
        };

        // Decode the buffer into an audio source.
        if (typeof Promise !== 'undefined' && Howler.ctx.decodeAudioData.length === 1) {
          Howler.ctx.decodeAudioData(arraybuffer).then(success).catch(error);
        } else {
          Howler.ctx.decodeAudioData(arraybuffer, success, error);
        }
      };

      /**
       * Sound is now loaded, so finish setting everything up and fire the loaded event.
       * @param  {Howl} self
       * @param  {Object} buffer The decoded buffer sound source.
       */
      var loadSound = function(self, buffer) {
        // Set the duration.
        if (buffer && !self._duration) {
          self._duration = buffer.duration;
        }

        // Setup a sprite if none is defined.
        if (Object.keys(self._sprite).length === 0) {
          self._sprite = {__default: [0, self._duration * 1000]};
        }

        // Fire the loaded event.
        if (self._state !== 'loaded') {
          self._state = 'loaded';
          self._emit('load');
          self._loadQueue();
        }
      };

      /**
       * Setup the audio context when available, or switch to HTML5 Audio mode.
       */
      var setupAudioContext = function() {
        // If we have already detected that Web Audio isn't supported, don't run this step again.
        if (!Howler.usingWebAudio) {
          return;
        }

        // Check if we are using Web Audio and setup the AudioContext if we are.
        try {
          if (typeof AudioContext !== 'undefined') {
            Howler.ctx = new AudioContext();
          } else if (typeof webkitAudioContext !== 'undefined') {
            Howler.ctx = new webkitAudioContext();
          } else {
            Howler.usingWebAudio = false;
          }
        } catch(e) {
          Howler.usingWebAudio = false;
        }

        // If the audio context creation still failed, set using web audio to false.
        if (!Howler.ctx) {
          Howler.usingWebAudio = false;
        }

        // Check if a webview is being used on iOS8 or earlier (rather than the browser).
        // If it is, disable Web Audio as it causes crashing.
        var iOS = (/iP(hone|od|ad)/.test(Howler._navigator && Howler._navigator.platform));
        var appVersion = Howler._navigator && Howler._navigator.appVersion.match(/OS (\d+)_(\d+)_?(\d+)?/);
        var version = appVersion ? parseInt(appVersion[1], 10) : null;
        if (iOS && version && version < 9) {
          var safari = /safari/.test(Howler._navigator && Howler._navigator.userAgent.toLowerCase());
          if (Howler._navigator && Howler._navigator.standalone && !safari || Howler._navigator && !Howler._navigator.standalone && !safari) {
            Howler.usingWebAudio = false;
          }
        }

        // Create and expose the master GainNode when using Web Audio (useful for plugins or advanced usage).
        if (Howler.usingWebAudio) {
          Howler.masterGain = (typeof Howler.ctx.createGain === 'undefined') ? Howler.ctx.createGainNode() : Howler.ctx.createGain();
          Howler.masterGain.gain.setValueAtTime(Howler._muted ? 0 : Howler._volume, Howler.ctx.currentTime);
          Howler.masterGain.connect(Howler.ctx.destination);
        }

        // Re-run the setup on Howler.
        Howler._setup();
      };

      // Add support for CommonJS libraries such as browserify.
      {
        exports.Howler = Howler;
        exports.Howl = Howl;
      }

      // Define globally in case AMD is not available or unused.
      if (typeof window !== 'undefined') {
        window.HowlerGlobal = HowlerGlobal;
        window.Howler = Howler;
        window.Howl = Howl;
        window.Sound = Sound;
      } else if (typeof commonjsGlobal !== 'undefined') { // Add to global in Node.js (for testing, etc).
        commonjsGlobal.HowlerGlobal = HowlerGlobal;
        commonjsGlobal.Howler = Howler;
        commonjsGlobal.Howl = Howl;
        commonjsGlobal.Sound = Sound;
      }
    })();


    /*!
     *  Spatial Plugin - Adds support for stereo and 3D audio where Web Audio is supported.
     *  
     *  howler.js v2.1.3
     *  howlerjs.com
     *
     *  (c) 2013-2019, James Simpson of GoldFire Studios
     *  goldfirestudios.com
     *
     *  MIT License
     */

    (function() {

      // Setup default properties.
      HowlerGlobal.prototype._pos = [0, 0, 0];
      HowlerGlobal.prototype._orientation = [0, 0, -1, 0, 1, 0];

      /** Global Methods **/
      /***************************************************************************/

      /**
       * Helper method to update the stereo panning position of all current Howls.
       * Future Howls will not use this value unless explicitly set.
       * @param  {Number} pan A value of -1.0 is all the way left and 1.0 is all the way right.
       * @return {Howler/Number}     Self or current stereo panning value.
       */
      HowlerGlobal.prototype.stereo = function(pan) {
        var self = this;

        // Stop right here if not using Web Audio.
        if (!self.ctx || !self.ctx.listener) {
          return self;
        }

        // Loop through all Howls and update their stereo panning.
        for (var i=self._howls.length-1; i>=0; i--) {
          self._howls[i].stereo(pan);
        }

        return self;
      };

      /**
       * Get/set the position of the listener in 3D cartesian space. Sounds using
       * 3D position will be relative to the listener's position.
       * @param  {Number} x The x-position of the listener.
       * @param  {Number} y The y-position of the listener.
       * @param  {Number} z The z-position of the listener.
       * @return {Howler/Array}   Self or current listener position.
       */
      HowlerGlobal.prototype.pos = function(x, y, z) {
        var self = this;

        // Stop right here if not using Web Audio.
        if (!self.ctx || !self.ctx.listener) {
          return self;
        }

        // Set the defaults for optional 'y' & 'z'.
        y = (typeof y !== 'number') ? self._pos[1] : y;
        z = (typeof z !== 'number') ? self._pos[2] : z;

        if (typeof x === 'number') {
          self._pos = [x, y, z];

          if (typeof self.ctx.listener.positionX !== 'undefined') {
            self.ctx.listener.positionX.setTargetAtTime(self._pos[0], Howler.ctx.currentTime, 0.1);
            self.ctx.listener.positionY.setTargetAtTime(self._pos[1], Howler.ctx.currentTime, 0.1);
            self.ctx.listener.positionZ.setTargetAtTime(self._pos[2], Howler.ctx.currentTime, 0.1);
          } else {
            self.ctx.listener.setPosition(self._pos[0], self._pos[1], self._pos[2]);
          }
        } else {
          return self._pos;
        }

        return self;
      };

      /**
       * Get/set the direction the listener is pointing in the 3D cartesian space.
       * A front and up vector must be provided. The front is the direction the
       * face of the listener is pointing, and up is the direction the top of the
       * listener is pointing. Thus, these values are expected to be at right angles
       * from each other.
       * @param  {Number} x   The x-orientation of the listener.
       * @param  {Number} y   The y-orientation of the listener.
       * @param  {Number} z   The z-orientation of the listener.
       * @param  {Number} xUp The x-orientation of the top of the listener.
       * @param  {Number} yUp The y-orientation of the top of the listener.
       * @param  {Number} zUp The z-orientation of the top of the listener.
       * @return {Howler/Array}     Returns self or the current orientation vectors.
       */
      HowlerGlobal.prototype.orientation = function(x, y, z, xUp, yUp, zUp) {
        var self = this;

        // Stop right here if not using Web Audio.
        if (!self.ctx || !self.ctx.listener) {
          return self;
        }

        // Set the defaults for optional 'y' & 'z'.
        var or = self._orientation;
        y = (typeof y !== 'number') ? or[1] : y;
        z = (typeof z !== 'number') ? or[2] : z;
        xUp = (typeof xUp !== 'number') ? or[3] : xUp;
        yUp = (typeof yUp !== 'number') ? or[4] : yUp;
        zUp = (typeof zUp !== 'number') ? or[5] : zUp;

        if (typeof x === 'number') {
          self._orientation = [x, y, z, xUp, yUp, zUp];

          if (typeof self.ctx.listener.forwardX !== 'undefined') {
            self.ctx.listener.forwardX.setTargetAtTime(x, Howler.ctx.currentTime, 0.1);
            self.ctx.listener.forwardY.setTargetAtTime(y, Howler.ctx.currentTime, 0.1);
            self.ctx.listener.forwardZ.setTargetAtTime(z, Howler.ctx.currentTime, 0.1);
            self.ctx.listener.upX.setTargetAtTime(xUp, Howler.ctx.currentTime, 0.1);
            self.ctx.listener.upY.setTargetAtTime(yUp, Howler.ctx.currentTime, 0.1);
            self.ctx.listener.upZ.setTargetAtTime(zUp, Howler.ctx.currentTime, 0.1);
          } else {
            self.ctx.listener.setOrientation(x, y, z, xUp, yUp, zUp);
          }
        } else {
          return or;
        }

        return self;
      };

      /** Group Methods **/
      /***************************************************************************/

      /**
       * Add new properties to the core init.
       * @param  {Function} _super Core init method.
       * @return {Howl}
       */
      Howl.prototype.init = (function(_super) {
        return function(o) {
          var self = this;

          // Setup user-defined default properties.
          self._orientation = o.orientation || [1, 0, 0];
          self._stereo = o.stereo || null;
          self._pos = o.pos || null;
          self._pannerAttr = {
            coneInnerAngle: typeof o.coneInnerAngle !== 'undefined' ? o.coneInnerAngle : 360,
            coneOuterAngle: typeof o.coneOuterAngle !== 'undefined' ? o.coneOuterAngle : 360,
            coneOuterGain: typeof o.coneOuterGain !== 'undefined' ? o.coneOuterGain : 0,
            distanceModel: typeof o.distanceModel !== 'undefined' ? o.distanceModel : 'inverse',
            maxDistance: typeof o.maxDistance !== 'undefined' ? o.maxDistance : 10000,
            panningModel: typeof o.panningModel !== 'undefined' ? o.panningModel : 'HRTF',
            refDistance: typeof o.refDistance !== 'undefined' ? o.refDistance : 1,
            rolloffFactor: typeof o.rolloffFactor !== 'undefined' ? o.rolloffFactor : 1
          };

          // Setup event listeners.
          self._onstereo = o.onstereo ? [{fn: o.onstereo}] : [];
          self._onpos = o.onpos ? [{fn: o.onpos}] : [];
          self._onorientation = o.onorientation ? [{fn: o.onorientation}] : [];

          // Complete initilization with howler.js core's init function.
          return _super.call(this, o);
        };
      })(Howl.prototype.init);

      /**
       * Get/set the stereo panning of the audio source for this sound or all in the group.
       * @param  {Number} pan  A value of -1.0 is all the way left and 1.0 is all the way right.
       * @param  {Number} id (optional) The sound ID. If none is passed, all in group will be updated.
       * @return {Howl/Number}    Returns self or the current stereo panning value.
       */
      Howl.prototype.stereo = function(pan, id) {
        var self = this;

        // Stop right here if not using Web Audio.
        if (!self._webAudio) {
          return self;
        }

        // If the sound hasn't loaded, add it to the load queue to change stereo pan when capable.
        if (self._state !== 'loaded') {
          self._queue.push({
            event: 'stereo',
            action: function() {
              self.stereo(pan, id);
            }
          });

          return self;
        }

        // Check for PannerStereoNode support and fallback to PannerNode if it doesn't exist.
        var pannerType = (typeof Howler.ctx.createStereoPanner === 'undefined') ? 'spatial' : 'stereo';

        // Setup the group's stereo panning if no ID is passed.
        if (typeof id === 'undefined') {
          // Return the group's stereo panning if no parameters are passed.
          if (typeof pan === 'number') {
            self._stereo = pan;
            self._pos = [pan, 0, 0];
          } else {
            return self._stereo;
          }
        }

        // Change the streo panning of one or all sounds in group.
        var ids = self._getSoundIds(id);
        for (var i=0; i<ids.length; i++) {
          // Get the sound.
          var sound = self._soundById(ids[i]);

          if (sound) {
            if (typeof pan === 'number') {
              sound._stereo = pan;
              sound._pos = [pan, 0, 0];

              if (sound._node) {
                // If we are falling back, make sure the panningModel is equalpower.
                sound._pannerAttr.panningModel = 'equalpower';

                // Check if there is a panner setup and create a new one if not.
                if (!sound._panner || !sound._panner.pan) {
                  setupPanner(sound, pannerType);
                }

                if (pannerType === 'spatial') {
                  if (typeof sound._panner.positionX !== 'undefined') {
                    sound._panner.positionX.setValueAtTime(pan, Howler.ctx.currentTime);
                    sound._panner.positionY.setValueAtTime(0, Howler.ctx.currentTime);
                    sound._panner.positionZ.setValueAtTime(0, Howler.ctx.currentTime);
                  } else {
                    sound._panner.setPosition(pan, 0, 0);
                  }
                } else {
                  sound._panner.pan.setValueAtTime(pan, Howler.ctx.currentTime);
                }
              }

              self._emit('stereo', sound._id);
            } else {
              return sound._stereo;
            }
          }
        }

        return self;
      };

      /**
       * Get/set the 3D spatial position of the audio source for this sound or group relative to the global listener.
       * @param  {Number} x  The x-position of the audio source.
       * @param  {Number} y  The y-position of the audio source.
       * @param  {Number} z  The z-position of the audio source.
       * @param  {Number} id (optional) The sound ID. If none is passed, all in group will be updated.
       * @return {Howl/Array}    Returns self or the current 3D spatial position: [x, y, z].
       */
      Howl.prototype.pos = function(x, y, z, id) {
        var self = this;

        // Stop right here if not using Web Audio.
        if (!self._webAudio) {
          return self;
        }

        // If the sound hasn't loaded, add it to the load queue to change position when capable.
        if (self._state !== 'loaded') {
          self._queue.push({
            event: 'pos',
            action: function() {
              self.pos(x, y, z, id);
            }
          });

          return self;
        }

        // Set the defaults for optional 'y' & 'z'.
        y = (typeof y !== 'number') ? 0 : y;
        z = (typeof z !== 'number') ? -0.5 : z;

        // Setup the group's spatial position if no ID is passed.
        if (typeof id === 'undefined') {
          // Return the group's spatial position if no parameters are passed.
          if (typeof x === 'number') {
            self._pos = [x, y, z];
          } else {
            return self._pos;
          }
        }

        // Change the spatial position of one or all sounds in group.
        var ids = self._getSoundIds(id);
        for (var i=0; i<ids.length; i++) {
          // Get the sound.
          var sound = self._soundById(ids[i]);

          if (sound) {
            if (typeof x === 'number') {
              sound._pos = [x, y, z];

              if (sound._node) {
                // Check if there is a panner setup and create a new one if not.
                if (!sound._panner || sound._panner.pan) {
                  setupPanner(sound, 'spatial');
                }

                if (typeof sound._panner.positionX !== 'undefined') {
                  sound._panner.positionX.setValueAtTime(x, Howler.ctx.currentTime);
                  sound._panner.positionY.setValueAtTime(y, Howler.ctx.currentTime);
                  sound._panner.positionZ.setValueAtTime(z, Howler.ctx.currentTime);
                } else {
                  sound._panner.setPosition(x, y, z);
                }
              }

              self._emit('pos', sound._id);
            } else {
              return sound._pos;
            }
          }
        }

        return self;
      };

      /**
       * Get/set the direction the audio source is pointing in the 3D cartesian coordinate
       * space. Depending on how direction the sound is, based on the `cone` attributes,
       * a sound pointing away from the listener can be quiet or silent.
       * @param  {Number} x  The x-orientation of the source.
       * @param  {Number} y  The y-orientation of the source.
       * @param  {Number} z  The z-orientation of the source.
       * @param  {Number} id (optional) The sound ID. If none is passed, all in group will be updated.
       * @return {Howl/Array}    Returns self or the current 3D spatial orientation: [x, y, z].
       */
      Howl.prototype.orientation = function(x, y, z, id) {
        var self = this;

        // Stop right here if not using Web Audio.
        if (!self._webAudio) {
          return self;
        }

        // If the sound hasn't loaded, add it to the load queue to change orientation when capable.
        if (self._state !== 'loaded') {
          self._queue.push({
            event: 'orientation',
            action: function() {
              self.orientation(x, y, z, id);
            }
          });

          return self;
        }

        // Set the defaults for optional 'y' & 'z'.
        y = (typeof y !== 'number') ? self._orientation[1] : y;
        z = (typeof z !== 'number') ? self._orientation[2] : z;

        // Setup the group's spatial orientation if no ID is passed.
        if (typeof id === 'undefined') {
          // Return the group's spatial orientation if no parameters are passed.
          if (typeof x === 'number') {
            self._orientation = [x, y, z];
          } else {
            return self._orientation;
          }
        }

        // Change the spatial orientation of one or all sounds in group.
        var ids = self._getSoundIds(id);
        for (var i=0; i<ids.length; i++) {
          // Get the sound.
          var sound = self._soundById(ids[i]);

          if (sound) {
            if (typeof x === 'number') {
              sound._orientation = [x, y, z];

              if (sound._node) {
                // Check if there is a panner setup and create a new one if not.
                if (!sound._panner) {
                  // Make sure we have a position to setup the node with.
                  if (!sound._pos) {
                    sound._pos = self._pos || [0, 0, -0.5];
                  }

                  setupPanner(sound, 'spatial');
                }

                if (typeof sound._panner.orientationX !== 'undefined') {
                  sound._panner.orientationX.setValueAtTime(x, Howler.ctx.currentTime);
                  sound._panner.orientationY.setValueAtTime(y, Howler.ctx.currentTime);
                  sound._panner.orientationZ.setValueAtTime(z, Howler.ctx.currentTime);
                } else {
                  sound._panner.setOrientation(x, y, z);
                }
              }

              self._emit('orientation', sound._id);
            } else {
              return sound._orientation;
            }
          }
        }

        return self;
      };

      /**
       * Get/set the panner node's attributes for a sound or group of sounds.
       * This method can optionall take 0, 1 or 2 arguments.
       *   pannerAttr() -> Returns the group's values.
       *   pannerAttr(id) -> Returns the sound id's values.
       *   pannerAttr(o) -> Set's the values of all sounds in this Howl group.
       *   pannerAttr(o, id) -> Set's the values of passed sound id.
       *
       *   Attributes:
       *     coneInnerAngle - (360 by default) A parameter for directional audio sources, this is an angle, in degrees,
       *                      inside of which there will be no volume reduction.
       *     coneOuterAngle - (360 by default) A parameter for directional audio sources, this is an angle, in degrees,
       *                      outside of which the volume will be reduced to a constant value of `coneOuterGain`.
       *     coneOuterGain - (0 by default) A parameter for directional audio sources, this is the gain outside of the
       *                     `coneOuterAngle`. It is a linear value in the range `[0, 1]`.
       *     distanceModel - ('inverse' by default) Determines algorithm used to reduce volume as audio moves away from
       *                     listener. Can be `linear`, `inverse` or `exponential.
       *     maxDistance - (10000 by default) The maximum distance between source and listener, after which the volume
       *                   will not be reduced any further.
       *     refDistance - (1 by default) A reference distance for reducing volume as source moves further from the listener.
       *                   This is simply a variable of the distance model and has a different effect depending on which model
       *                   is used and the scale of your coordinates. Generally, volume will be equal to 1 at this distance.
       *     rolloffFactor - (1 by default) How quickly the volume reduces as source moves from listener. This is simply a
       *                     variable of the distance model and can be in the range of `[0, 1]` with `linear` and `[0, ∞]`
       *                     with `inverse` and `exponential`.
       *     panningModel - ('HRTF' by default) Determines which spatialization algorithm is used to position audio.
       *                     Can be `HRTF` or `equalpower`.
       *
       * @return {Howl/Object} Returns self or current panner attributes.
       */
      Howl.prototype.pannerAttr = function() {
        var self = this;
        var args = arguments;
        var o, id, sound;

        // Stop right here if not using Web Audio.
        if (!self._webAudio) {
          return self;
        }

        // Determine the values based on arguments.
        if (args.length === 0) {
          // Return the group's panner attribute values.
          return self._pannerAttr;
        } else if (args.length === 1) {
          if (typeof args[0] === 'object') {
            o = args[0];

            // Set the grou's panner attribute values.
            if (typeof id === 'undefined') {
              if (!o.pannerAttr) {
                o.pannerAttr = {
                  coneInnerAngle: o.coneInnerAngle,
                  coneOuterAngle: o.coneOuterAngle,
                  coneOuterGain: o.coneOuterGain,
                  distanceModel: o.distanceModel,
                  maxDistance: o.maxDistance,
                  refDistance: o.refDistance,
                  rolloffFactor: o.rolloffFactor,
                  panningModel: o.panningModel
                };
              }

              self._pannerAttr = {
                coneInnerAngle: typeof o.pannerAttr.coneInnerAngle !== 'undefined' ? o.pannerAttr.coneInnerAngle : self._coneInnerAngle,
                coneOuterAngle: typeof o.pannerAttr.coneOuterAngle !== 'undefined' ? o.pannerAttr.coneOuterAngle : self._coneOuterAngle,
                coneOuterGain: typeof o.pannerAttr.coneOuterGain !== 'undefined' ? o.pannerAttr.coneOuterGain : self._coneOuterGain,
                distanceModel: typeof o.pannerAttr.distanceModel !== 'undefined' ? o.pannerAttr.distanceModel : self._distanceModel,
                maxDistance: typeof o.pannerAttr.maxDistance !== 'undefined' ? o.pannerAttr.maxDistance : self._maxDistance,
                refDistance: typeof o.pannerAttr.refDistance !== 'undefined' ? o.pannerAttr.refDistance : self._refDistance,
                rolloffFactor: typeof o.pannerAttr.rolloffFactor !== 'undefined' ? o.pannerAttr.rolloffFactor : self._rolloffFactor,
                panningModel: typeof o.pannerAttr.panningModel !== 'undefined' ? o.pannerAttr.panningModel : self._panningModel
              };
            }
          } else {
            // Return this sound's panner attribute values.
            sound = self._soundById(parseInt(args[0], 10));
            return sound ? sound._pannerAttr : self._pannerAttr;
          }
        } else if (args.length === 2) {
          o = args[0];
          id = parseInt(args[1], 10);
        }

        // Update the values of the specified sounds.
        var ids = self._getSoundIds(id);
        for (var i=0; i<ids.length; i++) {
          sound = self._soundById(ids[i]);

          if (sound) {
            // Merge the new values into the sound.
            var pa = sound._pannerAttr;
            pa = {
              coneInnerAngle: typeof o.coneInnerAngle !== 'undefined' ? o.coneInnerAngle : pa.coneInnerAngle,
              coneOuterAngle: typeof o.coneOuterAngle !== 'undefined' ? o.coneOuterAngle : pa.coneOuterAngle,
              coneOuterGain: typeof o.coneOuterGain !== 'undefined' ? o.coneOuterGain : pa.coneOuterGain,
              distanceModel: typeof o.distanceModel !== 'undefined' ? o.distanceModel : pa.distanceModel,
              maxDistance: typeof o.maxDistance !== 'undefined' ? o.maxDistance : pa.maxDistance,
              refDistance: typeof o.refDistance !== 'undefined' ? o.refDistance : pa.refDistance,
              rolloffFactor: typeof o.rolloffFactor !== 'undefined' ? o.rolloffFactor : pa.rolloffFactor,
              panningModel: typeof o.panningModel !== 'undefined' ? o.panningModel : pa.panningModel
            };

            // Update the panner values or create a new panner if none exists.
            var panner = sound._panner;
            if (panner) {
              panner.coneInnerAngle = pa.coneInnerAngle;
              panner.coneOuterAngle = pa.coneOuterAngle;
              panner.coneOuterGain = pa.coneOuterGain;
              panner.distanceModel = pa.distanceModel;
              panner.maxDistance = pa.maxDistance;
              panner.refDistance = pa.refDistance;
              panner.rolloffFactor = pa.rolloffFactor;
              panner.panningModel = pa.panningModel;
            } else {
              // Make sure we have a position to setup the node with.
              if (!sound._pos) {
                sound._pos = self._pos || [0, 0, -0.5];
              }

              // Create a new panner node.
              setupPanner(sound, 'spatial');
            }
          }
        }

        return self;
      };

      /** Single Sound Methods **/
      /***************************************************************************/

      /**
       * Add new properties to the core Sound init.
       * @param  {Function} _super Core Sound init method.
       * @return {Sound}
       */
      Sound.prototype.init = (function(_super) {
        return function() {
          var self = this;
          var parent = self._parent;

          // Setup user-defined default properties.
          self._orientation = parent._orientation;
          self._stereo = parent._stereo;
          self._pos = parent._pos;
          self._pannerAttr = parent._pannerAttr;

          // Complete initilization with howler.js core Sound's init function.
          _super.call(this);

          // If a stereo or position was specified, set it up.
          if (self._stereo) {
            parent.stereo(self._stereo);
          } else if (self._pos) {
            parent.pos(self._pos[0], self._pos[1], self._pos[2], self._id);
          }
        };
      })(Sound.prototype.init);

      /**
       * Override the Sound.reset method to clean up properties from the spatial plugin.
       * @param  {Function} _super Sound reset method.
       * @return {Sound}
       */
      Sound.prototype.reset = (function(_super) {
        return function() {
          var self = this;
          var parent = self._parent;

          // Reset all spatial plugin properties on this sound.
          self._orientation = parent._orientation;
          self._stereo = parent._stereo;
          self._pos = parent._pos;
          self._pannerAttr = parent._pannerAttr;

          // If a stereo or position was specified, set it up.
          if (self._stereo) {
            parent.stereo(self._stereo);
          } else if (self._pos) {
            parent.pos(self._pos[0], self._pos[1], self._pos[2], self._id);
          } else if (self._panner) {
            // Disconnect the panner.
            self._panner.disconnect(0);
            self._panner = undefined;
            parent._refreshBuffer(self);
          }

          // Complete resetting of the sound.
          return _super.call(this);
        };
      })(Sound.prototype.reset);

      /** Helper Methods **/
      /***************************************************************************/

      /**
       * Create a new panner node and save it on the sound.
       * @param  {Sound} sound Specific sound to setup panning on.
       * @param {String} type Type of panner to create: 'stereo' or 'spatial'.
       */
      var setupPanner = function(sound, type) {
        type = type || 'spatial';

        // Create the new panner node.
        if (type === 'spatial') {
          sound._panner = Howler.ctx.createPanner();
          sound._panner.coneInnerAngle = sound._pannerAttr.coneInnerAngle;
          sound._panner.coneOuterAngle = sound._pannerAttr.coneOuterAngle;
          sound._panner.coneOuterGain = sound._pannerAttr.coneOuterGain;
          sound._panner.distanceModel = sound._pannerAttr.distanceModel;
          sound._panner.maxDistance = sound._pannerAttr.maxDistance;
          sound._panner.refDistance = sound._pannerAttr.refDistance;
          sound._panner.rolloffFactor = sound._pannerAttr.rolloffFactor;
          sound._panner.panningModel = sound._pannerAttr.panningModel;

          if (typeof sound._panner.positionX !== 'undefined') {
            sound._panner.positionX.setValueAtTime(sound._pos[0], Howler.ctx.currentTime);
            sound._panner.positionY.setValueAtTime(sound._pos[1], Howler.ctx.currentTime);
            sound._panner.positionZ.setValueAtTime(sound._pos[2], Howler.ctx.currentTime);
          } else {
            sound._panner.setPosition(sound._pos[0], sound._pos[1], sound._pos[2]);
          }

          if (typeof sound._panner.orientationX !== 'undefined') {
            sound._panner.orientationX.setValueAtTime(sound._orientation[0], Howler.ctx.currentTime);
            sound._panner.orientationY.setValueAtTime(sound._orientation[1], Howler.ctx.currentTime);
            sound._panner.orientationZ.setValueAtTime(sound._orientation[2], Howler.ctx.currentTime);
          } else {
            sound._panner.setOrientation(sound._orientation[0], sound._orientation[1], sound._orientation[2]);
          }
        } else {
          sound._panner = Howler.ctx.createStereoPanner();
          sound._panner.pan.setValueAtTime(sound._stereo, Howler.ctx.currentTime);
        }

        sound._panner.connect(sound._node);

        // Update the connections.
        if (!sound._paused) {
          sound._parent.pause(sound._id, true).play(sound._id, true);
        }
      };
    })();
    });
    var howler_1 = howler.Howler;
    var howler_2 = howler.Howl;

    const soundEffects = new howler_2({
      ...spriteMap,
      src: ["./Assets/audio/dragDropAudioSprite.mp3"],
    });

    soundEffects.volume(0.25);

    /* src\components\Operator.svelte generated by Svelte v3.21.0 */

    const { console: console_1 } = globals;
    const file = "src\\components\\Operator.svelte";

    // (39:2) {#if !divide}
    function create_if_block(ctx) {
    	let t_value = /*operator*/ ctx[0].symbol + "";
    	let t;

    	const block = {
    		c: function create() {
    			t = text(t_value);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*operator*/ 1 && t_value !== (t_value = /*operator*/ ctx[0].symbol + "")) set_data_dev(t, t_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(39:2) {#if !divide}",
    		ctx
    	});

    	return block;
    }

    function create_fragment(ctx) {
    	let div;
    	let dispose;
    	let if_block = !/*divide*/ ctx[1] && create_if_block(ctx);

    	const block = {
    		c: function create() {
    			div = element("div");
    			if (if_block) if_block.c();
    			attr_dev(div, "class", "operator no-highlight svelte-9mh0yx");
    			toggle_class(div, "divide", /*divide*/ ctx[1]);
    			add_location(div, file, 37, 0, 792);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor, remount) {
    			insert_dev(target, div, anchor);
    			if (if_block) if_block.m(div, null);
    			if (remount) dispose();
    			dispose = listen_dev(div, "dblclick", /*handleDoubleCLick*/ ctx[2], false, false, false);
    		},
    		p: function update(ctx, [dirty]) {
    			if (!/*divide*/ ctx[1]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block(ctx);
    					if_block.c();
    					if_block.m(div, null);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}

    			if (dirty & /*divide*/ 2) {
    				toggle_class(div, "divide", /*divide*/ ctx[1]);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if (if_block) if_block.d();
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance($$self, $$props, $$invalidate) {
    	let { operator } = $$props;
    	let { siblings = null } = $$props;

    	function handleDoubleCLick(e) {
    		console.log(siblings);
    		let index = siblings.indexOf(operator);
    		console.log(index);
    		draftEquation.draftOperation(siblings[index - 1], siblings[index + 1]);
    		draftEquation.apply();
    	}

    	const writable_props = ["operator", "siblings"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1.warn(`<Operator> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Operator", $$slots, []);

    	$$self.$set = $$props => {
    		if ("operator" in $$props) $$invalidate(0, operator = $$props.operator);
    		if ("siblings" in $$props) $$invalidate(3, siblings = $$props.siblings);
    	};

    	$$self.$capture_state = () => ({
    		DivideOperator,
    		draftEquation,
    		operator,
    		siblings,
    		handleDoubleCLick,
    		divide
    	});

    	$$self.$inject_state = $$props => {
    		if ("operator" in $$props) $$invalidate(0, operator = $$props.operator);
    		if ("siblings" in $$props) $$invalidate(3, siblings = $$props.siblings);
    		if ("divide" in $$props) $$invalidate(1, divide = $$props.divide);
    	};

    	let divide;

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*operator*/ 1) {
    			 $$invalidate(1, divide = operator instanceof DivideOperator);
    		}
    	};

    	return [operator, divide, handleDoubleCLick, siblings];
    }

    class Operator$1 extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, { operator: 0, siblings: 3 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Operator",
    			options,
    			id: create_fragment.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*operator*/ ctx[0] === undefined && !("operator" in props)) {
    			console_1.warn("<Operator> was created without expected prop 'operator'");
    		}
    	}

    	get operator() {
    		throw new Error("<Operator>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set operator(value) {
    		throw new Error("<Operator>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get siblings() {
    		throw new Error("<Operator>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set siblings(value) {
    		throw new Error("<Operator>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    function is_date(obj) {
        return Object.prototype.toString.call(obj) === '[object Date]';
    }

    function tick_spring(ctx, last_value, current_value, target_value) {
        if (typeof current_value === 'number' || is_date(current_value)) {
            // @ts-ignore
            const delta = target_value - current_value;
            // @ts-ignore
            const velocity = (current_value - last_value) / (ctx.dt || 1 / 60); // guard div by 0
            const spring = ctx.opts.stiffness * delta;
            const damper = ctx.opts.damping * velocity;
            const acceleration = (spring - damper) * ctx.inv_mass;
            const d = (velocity + acceleration) * ctx.dt;
            if (Math.abs(d) < ctx.opts.precision && Math.abs(delta) < ctx.opts.precision) {
                return target_value; // settled
            }
            else {
                ctx.settled = false; // signal loop to keep ticking
                // @ts-ignore
                return is_date(current_value) ?
                    new Date(current_value.getTime() + d) : current_value + d;
            }
        }
        else if (Array.isArray(current_value)) {
            // @ts-ignore
            return current_value.map((_, i) => tick_spring(ctx, last_value[i], current_value[i], target_value[i]));
        }
        else if (typeof current_value === 'object') {
            const next_value = {};
            for (const k in current_value)
                // @ts-ignore
                next_value[k] = tick_spring(ctx, last_value[k], current_value[k], target_value[k]);
            // @ts-ignore
            return next_value;
        }
        else {
            throw new Error(`Cannot spring ${typeof current_value} values`);
        }
    }
    function spring(value, opts = {}) {
        const store = writable(value);
        const { stiffness = 0.15, damping = 0.8, precision = 0.01 } = opts;
        let last_time;
        let task;
        let current_token;
        let last_value = value;
        let target_value = value;
        let inv_mass = 1;
        let inv_mass_recovery_rate = 0;
        let cancel_task = false;
        function set(new_value, opts = {}) {
            target_value = new_value;
            const token = current_token = {};
            if (value == null || opts.hard || (spring.stiffness >= 1 && spring.damping >= 1)) {
                cancel_task = true; // cancel any running animation
                last_time = now();
                last_value = new_value;
                store.set(value = target_value);
                return Promise.resolve();
            }
            else if (opts.soft) {
                const rate = opts.soft === true ? .5 : +opts.soft;
                inv_mass_recovery_rate = 1 / (rate * 60);
                inv_mass = 0; // infinite mass, unaffected by spring forces
            }
            if (!task) {
                last_time = now();
                cancel_task = false;
                task = loop(now => {
                    if (cancel_task) {
                        cancel_task = false;
                        task = null;
                        return false;
                    }
                    inv_mass = Math.min(inv_mass + inv_mass_recovery_rate, 1);
                    const ctx = {
                        inv_mass,
                        opts: spring,
                        settled: true,
                        dt: (now - last_time) * 60 / 1000
                    };
                    const next_value = tick_spring(ctx, last_value, value, target_value);
                    last_time = now;
                    last_value = value;
                    store.set(value = next_value);
                    if (ctx.settled)
                        task = null;
                    return !ctx.settled;
                });
            }
            return new Promise(fulfil => {
                task.promise.then(() => {
                    if (token === current_token)
                        fulfil();
                });
            });
        }
        const spring = {
            set,
            update: (fn, opts) => set(fn(target_value, value), opts),
            subscribe: store.subscribe,
            stiffness,
            damping,
            precision
        };
        return spring;
    }

    /**
     * Drag/drop directive for a node. Will allow a node to be picked up, dragged, and dropped over othse dragdrop nodes
     * 
     * Note that no part of this code changes the position or state of the node it's attached to. It merely maintains internal position and state data, and reports it to the client.
     * Anything involving movement and visual changes is handled by the .svelte file.
     *
     * @export
     * @param {DOMNode} node reference to the DOM node; this parameter is automatically assigned in Svelte
     * @param {Object} params 
     * @returns dragdrop directive
     */
    function dragdrop(node, parameters) { //TODO is type really necessary?
        let x;
        let y;
        let touchIndex = 0; // used to index drag/drop references for multi-touch interfaces
        let offset;
        let entered = null;
        var {type, canDrag} = parameters;  

        
        /**
         * Function for 'mousedown' event listener; registers node with window.drag registry and begins drag operation
         * @param {event} event
         */
        function handleMousedown(event) {
            event.stopPropagation();
            if (event.button !== 0)
                return;
            x = event.clientX;
            y = event.clientY;
            offset = { x, y };
            
            if (canDrag) {
                setNodeDrag(node, type, touchIndex);
                node.dispatchEvent(new CustomEvent('dragstart', {
                    detail: { x, y }
                }));

                window.addEventListener('mousemove', handleMousemove);
                window.addEventListener('mouseup', handleMouseup);
            }
        }


        /**
         * Function for 'mousemove' event listener; updates position data for the node
         * @param {event} event
         */
        function handleMousemove(event) {
            const dx = event.clientX - x;
            const dy = event.clientY - y;
            x = event.clientX;
            y = event.clientY;

            node.dispatchEvent(new CustomEvent('dragmove', {
                detail: { x, y, dx, dy }
            }));
        }

        
        /**
         * Function for 'mouseup' event listener; if no drop target is registered, then invoke 'dragend' on the node, otherwise invoke 'dropsend' on drag node, 
         * 'dropreceive' on drop node
         * Basically, if you let it go over nothing, just drop it, else perform some data transfer.
         * @param {event} event
         */
        function handleMouseup(event) {
            event.stopPropagation();
            x = event.clientX;
            y = event.clientY;

            let dropped = window.drop[touchIndex] && window.drop[touchIndex].node !== node;
            if (dropped) {
                node.dispatchEvent(new CustomEvent('dropsend', {
                    detail: { x, y },
                }));
                window.drop[touchIndex].node.dispatchEvent(new CustomEvent('dropreceive', {
                    detail: { x, y, drag: window.drag[touchIndex], drop: window.drop[touchIndex] },
                }));
                // node.dispatchEvent(new CustomEvent('dragend', {
                //     detail: { x, y }
                // }));
                // node.dispatchEvent(new CustomEvent('leave', {
                //     detail: { x, y }
                // }));
                // window.drop[touchIndex].node.dispatchEvent(new CustomEvent('dragleave', {
                //     detail: { x, y }
                // }));
            } else {
                node.dispatchEvent(new CustomEvent('dragend', {
                    detail: { x, y }
                }));
                node.dispatchEvent(new CustomEvent('leave', {
                    detail: { x, y }
                }));
            }
            unsetNodeDrag(touchIndex);
            unsetNodeDrop(touchIndex);

            window.removeEventListener('mousemove', handleMousemove);
            window.removeEventListener('mouseup', handleMouseup);

        }

        /**
         * Function for 'mouseenter' event listener; if dragging an object, trigger the 'dragenter' event on the node, if not, trigger the 'enter' event;
         * Mainly used to set the hover effects and drop target
         * @param {event} event 
         */
        function handleMouseenter(event) {
            event.stopPropagation();
            x = event.clientX;
            y = event.clientY;
            

            let index = event.detail instanceof Object ? event.detail.index : 0;

            if (window.drag[index] && window.drag[index].node !== node) {
                setNodeDrop(node, type, index);
                node.dispatchEvent(new CustomEvent('dragenter', {
                    detail: { x, y },
                }));
            } else {
                node.dispatchEvent(new CustomEvent('enter', {
                    detail: { x, y },
                }));
            }
        }

        /**
         * Function for 'mouseleave' event listener; if dragging an object, trigger the 'dragleave' event on the node, if not, trigger the 'leave' event;
         * Mainly used to unset the hover effects and drop target
         * @param {event} event
         */
        function handleMouseleave(event) {
            event.stopPropagation();

            x = event.clientX;
            y = event.clientY;
            

            let index = event.detail instanceof Object ? event.detail.index : 0;
            
            if (window.drag[index]) {
                unsetNodeDrop(index);
                node.dispatchEvent(new CustomEvent('dragleave', {
                    detail: { x, y },
                }));
                // document.elementFromPoint(x, y).parentElement.parentElement.dispatchEvent(new CustomEvent('dragenter', {
                //     detail: { x, y },
                // }))
            } else {
                node.dispatchEvent(new CustomEvent('leave', {
                    detail: { x, y },
                }));
                // document.elementFromPoint(x, y).dispatchEvent(new CustomEvent('enter', {
                //     detail: { x, y },
                // }))
            }
        }

        function handleTouchDown(event) {
            event.stopPropagation();
            if (!(event instanceof TouchEvent))
                return;
            touchIndex = event.changedTouches[0].identifier;
            let curEvent = Object.values(event.touches).find(t => t.identifier === touchIndex);
            x = curEvent.clientX;
            y = curEvent.clientY;
            offset = { x, y };


            node.dispatchEvent(new CustomEvent('dragstart', {
                detail: { dx: x - offset.x, dy: y - offset.y }
            }));

            window.addEventListener('touchmove', handleTouchMove, { passive: true });
            window.drag[touchIndex] = { node: node, type: type };
            window.drop[touchIndex] = null;
        }

        function handleTouchMove(event) {
            let curEvent = Object.values(event.touches).find(t => t.identifier === touchIndex);

            x = curEvent.clientX;
            y = curEvent.clientY;

            
            node.dispatchEvent(new CustomEvent('dragmove', {
                detail: { dx: x - offset.x, dy: y - offset.y }
            }));

            offset = { x, y };

            var element = document.elementFromPoint(x, y);
            if (!element)
                return;
            if (element !== entered) {
                if (entered) {
                    entered.dispatchEvent(new CustomEvent('leave', {
                        detail: { index: touchIndex },
                        bubbles: true
                    }));
                    // entered.dispatchEvent(new CustomEvent('mouseout', {
                    //     detail: { index: touchIndex },
                    //     bubbles: true
                    // }));
                }
                entered = element;
                entered.dispatchEvent(new CustomEvent('enter', {
                    detail: { index: touchIndex },
                    bubbles: true
                }));
                // entered.dispatchEvent(new CustomEvent('mouseover', {
                //     detail: { index: touchIndex },
                //     bubbles: true
                // }));
            }
        }

        function handleTouchEnd(event) {        
            let dropped = window.drop[touchIndex] && window.drop[touchIndex].node !== node;

            if (dropped) {
                node.dispatchEvent(new CustomEvent('dropsend', {
                    detail: { x, y }
                }));
            } else {
                node.dispatchEvent(new CustomEvent('dragend', {
                    detail: { x, y }
                }));
            }
            if (entered) {
                if (window.drag[touchIndex] && window.drop[touchIndex]) {
                    entered.dispatchEvent(new CustomEvent('dropreceive', {
                        detail: { x, y, drag: node, drop: window.drop[touchIndex].node },
                        bubbles: true
                    }));
                    entered.dispatchEvent(new CustomEvent('mouseleave', {
                        detail: { index: touchIndex },
                        bubbles: true
                    }));
                    entered.dispatchEvent(new CustomEvent('mouseout', {
                        detail: { index: touchIndex },
                        bubbles: true
                    }));
                }
            }
            window.drag[touchIndex] = null;
            window.drop[touchIndex] = null;

            window.removeEventListener('touchmove', handleTouchMove);
        }

        //Add all event listeners to node
        node.addEventListener('mousedown', handleMousedown);
        node.addEventListener('mouseover', handleMouseenter);
        node.addEventListener('mouseout', handleMouseleave);

        node.addEventListener('touchstart', handleTouchDown, { passive: true });
        node.addEventListener('touchend', handleTouchEnd, { passive: true });

        return {
            update(parameters) {
                ({canDrag, type} = parameters);
            },
            //When node is destroyed, all event listeners need to be destroyed too
            destroy() {
                node.removeEventListener('mousedown', handleMousedown);
                node.removeEventListener('mouseover', handleMouseenter);
                node.removeEventListener('mouseout', handleMouseleave);
                node.removeEventListener('touchstart', handleTouchDown);
                node.removeEventListener('touchend', handleTouchEnd);
            }
        };
    }

    /**
     * Create a reference to the currently dragged node in the window so that it can be referenced later
     * @param {DOMNode} node DOM node of the element being dragged
     * @param {Enum} type type of the element being dragged; used to determine valid drop targets
     * @param {int} index touch index of drag operation; used only with touchscreens which allow for multi-touch
     */
    function setNodeDrag(node, type, index = 0) {
        window.drag[index] = { node, type };
    }

    /**
     * Unsets the referece to the currently dragged node, because I use null checks to determine what operations to launch; called on 'mouseup' when the user is dragging 
     * @param {int} index touch index of the drag operation; used only with touchscreens which allow for multi-touch
     */
    function unsetNodeDrag(index = 0) {
        window.drag[index] = null;
    }

    /**
     * Create a reference to the node currently being dragged over in the window so that it can be referenced later (to call the 'dropreceive' event on it on drop for example)
     * @param {DOMNode} node DOM node of the element being hovered over
     * @param {Enum} type type of the element being hovered over; used to determine valid drop targets
     * @param {int} index touch index of drag operation; used only with touchscreens which allow for multi-touch
     */
    function setNodeDrop(node, type, index = 0) {
        window.drop[index] = { node, type };
    }

    /**
     * Unsets the referece to the node currently being dragged over, because I use null checks to determine what operations to launch; called on 'mouseleave' when the user is dragging
     * @param {int} index touch index of the drag operation; used only with touchscreens which allow for multi-touch
     */
    function unsetNodeDrop(index = 0) {
        window.drop[index] = null;
    }

    /* src\components\DragDrop.svelte generated by Svelte v3.21.0 */
    const file$1 = "src\\components\\DragDrop.svelte";

    const get_mover_slot_changes = dirty => ({
    	dragging: dirty & /*dragging*/ 4,
    	draghovering: dirty & /*dragHovering*/ 8,
    	hovering: dirty & /*hovering, dropAnim*/ 18,
    	fade: dirty & /*dropAnim*/ 16
    });

    const get_mover_slot_context = ctx => ({
    	dragging: /*dragging*/ ctx[2],
    	draghovering: /*dragHovering*/ ctx[3],
    	hovering: /*hovering*/ ctx[1] && !/*dropAnim*/ ctx[4],
    	fade: /*dropAnim*/ ctx[4]
    });

    const get_dropzone_slot_changes = dirty => ({
    	dragging: dirty & /*dragging*/ 4,
    	draghovering: dirty & /*dragHovering*/ 8,
    	hovering: dirty & /*hovering, dropAnim*/ 18
    });

    const get_dropzone_slot_context = ctx => ({
    	dragging: /*dragging*/ ctx[2],
    	draghovering: /*dragHovering*/ ctx[3],
    	hovering: /*hovering*/ ctx[1] && !/*dropAnim*/ ctx[4]
    });

    function create_fragment$1(ctx) {
    	let div2;
    	let div0;
    	let t;
    	let div1;
    	let dragdrop_action;
    	let current;
    	let dispose;
    	const dropzone_slot_template = /*$$slots*/ ctx[24].dropzone;
    	const dropzone_slot = create_slot(dropzone_slot_template, ctx, /*$$scope*/ ctx[23], get_dropzone_slot_context);
    	const mover_slot_template = /*$$slots*/ ctx[24].mover;
    	const mover_slot = create_slot(mover_slot_template, ctx, /*$$scope*/ ctx[23], get_mover_slot_context);

    	const block = {
    		c: function create() {
    			div2 = element("div");
    			div0 = element("div");
    			if (dropzone_slot) dropzone_slot.c();
    			t = space();
    			div1 = element("div");
    			if (mover_slot) mover_slot.c();
    			attr_dev(div0, "class", "dragdrop-dropzone");
    			add_location(div0, file$1, 124, 2, 2811);
    			attr_dev(div1, "class", "dragdrop-mover svelte-18vxct5");
    			set_style(div1, "transform", "translate(" + /*$coords*/ ctx[6].x + "px," + /*$coords*/ ctx[6].y + "px)");
    			add_location(div1, file$1, 131, 2, 2986);
    			attr_dev(div2, "class", "dragdrop svelte-18vxct5");
    			toggle_class(div2, "dragging", /*dragging*/ ctx[2]);
    			toggle_class(div2, "returning", /*returning*/ ctx[7]);
    			toggle_class(div2, "hovering", /*hovering*/ ctx[1]);
    			toggle_class(div2, "draghovering", /*dragHovering*/ ctx[3]);
    			add_location(div2, file$1, 108, 0, 2346);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor, remount) {
    			insert_dev(target, div2, anchor);
    			append_dev(div2, div0);

    			if (dropzone_slot) {
    				dropzone_slot.m(div0, null);
    			}

    			append_dev(div2, t);
    			append_dev(div2, div1);

    			if (mover_slot) {
    				mover_slot.m(div1, null);
    			}

    			current = true;
    			if (remount) run_all(dispose);

    			dispose = [
    				action_destroyer(dragdrop_action = dragdrop.call(null, div2, {
    					type: "dragdrop",
    					canDrag: /*canDrag*/ ctx[0]
    				})),
    				listen_dev(div2, "dragstart", /*handleDragStart*/ ctx[8], false, false, false),
    				listen_dev(div2, "dragmove", /*handleDragMove*/ ctx[9], false, false, false),
    				listen_dev(div2, "dragend", /*handleDragEnd*/ ctx[10], false, false, false),
    				listen_dev(div2, "enter", /*handleMouseEnter*/ ctx[11], false, false, false),
    				listen_dev(div2, "leave", /*handleMouseLeave*/ ctx[12], false, false, false),
    				listen_dev(div2, "dragenter", /*handleDragEnter*/ ctx[13], false, false, false),
    				listen_dev(div2, "dragleave", /*handleDragLeave*/ ctx[14], false, false, false),
    				listen_dev(div2, "dropsend", /*handleDropSend*/ ctx[15], false, false, false),
    				listen_dev(div2, "dropreceive", /*handleDropReceive*/ ctx[16], false, false, false)
    			];
    		},
    		p: function update(ctx, [dirty]) {
    			if (dropzone_slot) {
    				if (dropzone_slot.p && dirty & /*$$scope, dragging, dragHovering, hovering, dropAnim*/ 8388638) {
    					dropzone_slot.p(get_slot_context(dropzone_slot_template, ctx, /*$$scope*/ ctx[23], get_dropzone_slot_context), get_slot_changes(dropzone_slot_template, /*$$scope*/ ctx[23], dirty, get_dropzone_slot_changes));
    				}
    			}

    			if (mover_slot) {
    				if (mover_slot.p && dirty & /*$$scope, dragging, dragHovering, hovering, dropAnim*/ 8388638) {
    					mover_slot.p(get_slot_context(mover_slot_template, ctx, /*$$scope*/ ctx[23], get_mover_slot_context), get_slot_changes(mover_slot_template, /*$$scope*/ ctx[23], dirty, get_mover_slot_changes));
    				}
    			}

    			if (!current || dirty & /*$coords*/ 64) {
    				set_style(div1, "transform", "translate(" + /*$coords*/ ctx[6].x + "px," + /*$coords*/ ctx[6].y + "px)");
    			}

    			if (dragdrop_action && is_function(dragdrop_action.update) && dirty & /*canDrag*/ 1) dragdrop_action.update.call(null, {
    				type: "dragdrop",
    				canDrag: /*canDrag*/ ctx[0]
    			});

    			if (dirty & /*dragging*/ 4) {
    				toggle_class(div2, "dragging", /*dragging*/ ctx[2]);
    			}

    			if (dirty & /*returning*/ 128) {
    				toggle_class(div2, "returning", /*returning*/ ctx[7]);
    			}

    			if (dirty & /*hovering*/ 2) {
    				toggle_class(div2, "hovering", /*hovering*/ ctx[1]);
    			}

    			if (dirty & /*dragHovering*/ 8) {
    				toggle_class(div2, "draghovering", /*dragHovering*/ ctx[3]);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(dropzone_slot, local);
    			transition_in(mover_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(dropzone_slot, local);
    			transition_out(mover_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div2);
    			if (dropzone_slot) dropzone_slot.d(detaching);
    			if (mover_slot) mover_slot.d(detaching);
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$1($$self, $$props, $$invalidate) {
    	let $coords;
    	let { canDrag = true } = $$props;
    	let { canDragHover = true } = $$props;
    	let { dropSend = null } = $$props;
    	let { dropReceive = null } = $$props;
    	let { dragStart = null } = $$props;
    	let { dragHover = null } = $$props;
    	let { dragLeave = null } = $$props;
    	let hovering = false;
    	let dragging = false;
    	let returning = false;
    	let dragHovering = false;
    	let dropAnim = false;
    	const coords = spring({ x: 0, y: 0 }, { stiffness: 0.05, damping: 0.15 });
    	validate_store(coords, "coords");
    	component_subscribe($$self, coords, value => $$invalidate(6, $coords = value));

    	function handleDragStart() {
    		$$invalidate(5, coords.stiffness = $$invalidate(5, coords.damping = 1, coords), coords);
    		$$invalidate(2, dragging = true);
    		soundEffects.play("pop");
    		if (dragStart) dragStart(event);
    	}

    	function handleDragMove(event) {
    		coords.update($coords => ({
    			x: $coords.x + event.detail.dx,
    			y: $coords.y + event.detail.dy
    		}));
    	}

    	function handleDragEnd(event) {
    		$$invalidate(5, coords.stiffness = 0.05, coords);
    		$$invalidate(5, coords.damping = 0.15, coords);
    		coords.set({ x: 0, y: 0 });
    		$$invalidate(2, dragging = false);
    		$$invalidate(1, hovering = false);
    	}

    	function handleMouseEnter(event) {
    		$$invalidate(1, hovering = true);
    	}

    	function handleMouseLeave(event) {
    		$$invalidate(1, hovering = false);
    	}

    	function handleDragEnter(event) {
    		if (!canDragHover) return;
    		$$invalidate(3, dragHovering = true);
    		if (dragHover) dragHover(event);
    	}

    	function handleDragLeave(event) {
    		if (!canDragHover) return;
    		$$invalidate(3, dragHovering = false);
    		if (dragLeave) dragLeave(event);
    	}

    	function handleDropSend(event) {
    		// handleDragEnd(event);
    		handleMouseLeave();

    		$$invalidate(5, coords.stiffness = $$invalidate(5, coords.damping = 1, coords), coords);
    		$$invalidate(4, dropAnim = true);

    		setTimeout(
    			() => {
    				coords.set({ x: 0, y: 0 });
    				$$invalidate(4, dropAnim = false);
    				$$invalidate(2, dragging = false);
    			},
    			300
    		);

    		soundEffects.play("click");
    		if (dropSend) dropSend(event);
    	}

    	function handleDropReceive(event) {
    		if (!canDragHover) return;
    		handleDragLeave(event);
    		if (dropReceive) dropReceive(event);
    	}

    	const writable_props = [
    		"canDrag",
    		"canDragHover",
    		"dropSend",
    		"dropReceive",
    		"dragStart",
    		"dragHover",
    		"dragLeave"
    	];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<DragDrop> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("DragDrop", $$slots, ['dropzone','mover']);

    	$$self.$set = $$props => {
    		if ("canDrag" in $$props) $$invalidate(0, canDrag = $$props.canDrag);
    		if ("canDragHover" in $$props) $$invalidate(17, canDragHover = $$props.canDragHover);
    		if ("dropSend" in $$props) $$invalidate(18, dropSend = $$props.dropSend);
    		if ("dropReceive" in $$props) $$invalidate(19, dropReceive = $$props.dropReceive);
    		if ("dragStart" in $$props) $$invalidate(20, dragStart = $$props.dragStart);
    		if ("dragHover" in $$props) $$invalidate(21, dragHover = $$props.dragHover);
    		if ("dragLeave" in $$props) $$invalidate(22, dragLeave = $$props.dragLeave);
    		if ("$$scope" in $$props) $$invalidate(23, $$scope = $$props.$$scope);
    	};

    	$$self.$capture_state = () => ({
    		spring,
    		dragdrop,
    		soundEffects,
    		canDrag,
    		canDragHover,
    		dropSend,
    		dropReceive,
    		dragStart,
    		dragHover,
    		dragLeave,
    		hovering,
    		dragging,
    		returning,
    		dragHovering,
    		dropAnim,
    		coords,
    		handleDragStart,
    		handleDragMove,
    		handleDragEnd,
    		handleMouseEnter,
    		handleMouseLeave,
    		handleDragEnter,
    		handleDragLeave,
    		handleDropSend,
    		handleDropReceive,
    		$coords
    	});

    	$$self.$inject_state = $$props => {
    		if ("canDrag" in $$props) $$invalidate(0, canDrag = $$props.canDrag);
    		if ("canDragHover" in $$props) $$invalidate(17, canDragHover = $$props.canDragHover);
    		if ("dropSend" in $$props) $$invalidate(18, dropSend = $$props.dropSend);
    		if ("dropReceive" in $$props) $$invalidate(19, dropReceive = $$props.dropReceive);
    		if ("dragStart" in $$props) $$invalidate(20, dragStart = $$props.dragStart);
    		if ("dragHover" in $$props) $$invalidate(21, dragHover = $$props.dragHover);
    		if ("dragLeave" in $$props) $$invalidate(22, dragLeave = $$props.dragLeave);
    		if ("hovering" in $$props) $$invalidate(1, hovering = $$props.hovering);
    		if ("dragging" in $$props) $$invalidate(2, dragging = $$props.dragging);
    		if ("returning" in $$props) $$invalidate(7, returning = $$props.returning);
    		if ("dragHovering" in $$props) $$invalidate(3, dragHovering = $$props.dragHovering);
    		if ("dropAnim" in $$props) $$invalidate(4, dropAnim = $$props.dropAnim);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		canDrag,
    		hovering,
    		dragging,
    		dragHovering,
    		dropAnim,
    		coords,
    		$coords,
    		returning,
    		handleDragStart,
    		handleDragMove,
    		handleDragEnd,
    		handleMouseEnter,
    		handleMouseLeave,
    		handleDragEnter,
    		handleDragLeave,
    		handleDropSend,
    		handleDropReceive,
    		canDragHover,
    		dropSend,
    		dropReceive,
    		dragStart,
    		dragHover,
    		dragLeave,
    		$$scope,
    		$$slots
    	];
    }

    class DragDrop extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$1, create_fragment$1, safe_not_equal, {
    			canDrag: 0,
    			canDragHover: 17,
    			dropSend: 18,
    			dropReceive: 19,
    			dragStart: 20,
    			dragHover: 21,
    			dragLeave: 22
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "DragDrop",
    			options,
    			id: create_fragment$1.name
    		});
    	}

    	get canDrag() {
    		throw new Error("<DragDrop>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set canDrag(value) {
    		throw new Error("<DragDrop>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get canDragHover() {
    		throw new Error("<DragDrop>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set canDragHover(value) {
    		throw new Error("<DragDrop>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get dropSend() {
    		throw new Error("<DragDrop>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set dropSend(value) {
    		throw new Error("<DragDrop>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get dropReceive() {
    		throw new Error("<DragDrop>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set dropReceive(value) {
    		throw new Error("<DragDrop>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get dragStart() {
    		throw new Error("<DragDrop>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set dragStart(value) {
    		throw new Error("<DragDrop>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get dragHover() {
    		throw new Error("<DragDrop>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set dragHover(value) {
    		throw new Error("<DragDrop>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get dragLeave() {
    		throw new Error("<DragDrop>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set dragLeave(value) {
    		throw new Error("<DragDrop>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\components\Token.svelte generated by Svelte v3.21.0 */
    const file$2 = "src\\components\\Token.svelte";

    // (119:6) {:else}
    function create_else_block_1(ctx) {
    	let div;
    	let t;

    	const block = {
    		c: function create() {
    			div = element("div");
    			t = text(/*value*/ ctx[1]);
    			add_location(div, file$2, 119, 8, 2674);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*value*/ 2) set_data_dev(t, /*value*/ ctx[1]);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block_1.name,
    		type: "else",
    		source: "(119:6) {:else}",
    		ctx
    	});

    	return block;
    }

    // (117:6) {#if token.unknown}
    function create_if_block_1(ctx) {
    	let input;
    	let input_size_value;
    	let dispose;

    	const block = {
    		c: function create() {
    			input = element("input");
    			attr_dev(input, "size", input_size_value = 1);
    			attr_dev(input, "class", "svelte-lbinij");
    			add_location(input, file$2, 117, 8, 2601);
    		},
    		m: function mount(target, anchor, remount) {
    			insert_dev(target, input, anchor);
    			if (remount) dispose();
    			dispose = listen_dev(input, "change", /*handleUpdateToken*/ ctx[4], false, false, false);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(input);
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1.name,
    		type: "if",
    		source: "(117:6) {#if token.unknown}",
    		ctx
    	});

    	return block;
    }

    // (111:4) <div        slot="dropzone"        class="token-inner no-highlight dropzone"        class:dragging        class:hovering        class:draghovering>
    function create_dropzone_slot(ctx) {
    	let div;

    	function select_block_type(ctx, dirty) {
    		if (/*token*/ ctx[0].unknown) return create_if_block_1;
    		return create_else_block_1;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block = current_block_type(ctx);

    	const block = {
    		c: function create() {
    			div = element("div");
    			if_block.c();
    			attr_dev(div, "slot", "dropzone");
    			attr_dev(div, "class", "token-inner no-highlight dropzone svelte-lbinij");
    			toggle_class(div, "dragging", /*dragging*/ ctx[6]);
    			toggle_class(div, "hovering", /*hovering*/ ctx[7]);
    			toggle_class(div, "draghovering", /*draghovering*/ ctx[9]);
    			add_location(div, file$2, 110, 4, 2417);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			if_block.m(div, null);
    		},
    		p: function update(ctx, dirty) {
    			if (current_block_type === (current_block_type = select_block_type(ctx)) && if_block) {
    				if_block.p(ctx, dirty);
    			} else {
    				if_block.d(1);
    				if_block = current_block_type(ctx);

    				if (if_block) {
    					if_block.c();
    					if_block.m(div, null);
    				}
    			}

    			if (dirty & /*dragging*/ 64) {
    				toggle_class(div, "dragging", /*dragging*/ ctx[6]);
    			}

    			if (dirty & /*hovering*/ 128) {
    				toggle_class(div, "hovering", /*hovering*/ ctx[7]);
    			}

    			if (dirty & /*draghovering*/ 512) {
    				toggle_class(div, "draghovering", /*draghovering*/ ctx[9]);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if_block.d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_dropzone_slot.name,
    		type: "slot",
    		source: "(111:4) <div        slot=\\\"dropzone\\\"        class=\\\"token-inner no-highlight dropzone\\\"        class:dragging        class:hovering        class:draghovering>",
    		ctx
    	});

    	return block;
    }

    // (132:6) {:else}
    function create_else_block(ctx) {
    	let div;
    	let t;

    	const block = {
    		c: function create() {
    			div = element("div");
    			t = text(/*value*/ ctx[1]);
    			add_location(div, file$2, 132, 8, 2951);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*value*/ 2) set_data_dev(t, /*value*/ ctx[1]);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block.name,
    		type: "else",
    		source: "(132:6) {:else}",
    		ctx
    	});

    	return block;
    }

    // (130:6) {#if token.unknown}
    function create_if_block$1(ctx) {
    	let div;

    	const block = {
    		c: function create() {
    			div = element("div");
    			add_location(div, file$2, 130, 8, 2919);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$1.name,
    		type: "if",
    		source: "(130:6) {#if token.unknown}",
    		ctx
    	});

    	return block;
    }

    // (123:4) <div        slot="mover"        class="token-inner no-highlight mover"        class:dragging        class:hovering        class:draghovering        class:fade>
    function create_mover_slot(ctx) {
    	let div;

    	function select_block_type_1(ctx, dirty) {
    		if (/*token*/ ctx[0].unknown) return create_if_block$1;
    		return create_else_block;
    	}

    	let current_block_type = select_block_type_1(ctx);
    	let if_block = current_block_type(ctx);

    	const block = {
    		c: function create() {
    			div = element("div");
    			if_block.c();
    			attr_dev(div, "slot", "mover");
    			attr_dev(div, "class", "token-inner no-highlight mover svelte-lbinij");
    			toggle_class(div, "dragging", /*dragging*/ ctx[6]);
    			toggle_class(div, "hovering", /*hovering*/ ctx[7]);
    			toggle_class(div, "draghovering", /*draghovering*/ ctx[9]);
    			toggle_class(div, "fade", /*fade*/ ctx[8]);
    			add_location(div, file$2, 122, 4, 2723);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			if_block.m(div, null);
    		},
    		p: function update(ctx, dirty) {
    			if (current_block_type === (current_block_type = select_block_type_1(ctx)) && if_block) {
    				if_block.p(ctx, dirty);
    			} else {
    				if_block.d(1);
    				if_block = current_block_type(ctx);

    				if (if_block) {
    					if_block.c();
    					if_block.m(div, null);
    				}
    			}

    			if (dirty & /*dragging*/ 64) {
    				toggle_class(div, "dragging", /*dragging*/ ctx[6]);
    			}

    			if (dirty & /*hovering*/ 128) {
    				toggle_class(div, "hovering", /*hovering*/ ctx[7]);
    			}

    			if (dirty & /*draghovering*/ 512) {
    				toggle_class(div, "draghovering", /*draghovering*/ ctx[9]);
    			}

    			if (dirty & /*fade*/ 256) {
    				toggle_class(div, "fade", /*fade*/ ctx[8]);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if_block.d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_mover_slot.name,
    		type: "slot",
    		source: "(123:4) <div        slot=\\\"mover\\\"        class=\\\"token-inner no-highlight mover\\\"        class:dragging        class:hovering        class:draghovering        class:fade>",
    		ctx
    	});

    	return block;
    }

    // (101:2) <DragDrop      let:dragging      let:hovering      let:fade      let:draghovering      canDrag={!token.unknown}      dragStart={handleDragStart}      dropReceive={handleDropReceive}      dragLeave={handleDragLeave}      dragHover={handleDragHover}>
    function create_default_slot(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = space();
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot.name,
    		type: "slot",
    		source: "(101:2) <DragDrop      let:dragging      let:hovering      let:fade      let:draghovering      canDrag={!token.unknown}      dragStart={handleDragStart}      dropReceive={handleDropReceive}      dragLeave={handleDragLeave}      dragHover={handleDragHover}>",
    		ctx
    	});

    	return block;
    }

    function create_fragment$2(ctx) {
    	let div;
    	let current;

    	const dragdrop = new DragDrop({
    			props: {
    				canDrag: !/*token*/ ctx[0].unknown,
    				dragStart: /*handleDragStart*/ ctx[2],
    				dropReceive: handleDropReceive,
    				dragLeave: handleDragLeave,
    				dragHover: /*handleDragHover*/ ctx[3],
    				$$slots: {
    					default: [
    						create_default_slot,
    						({ dragging, hovering, fade, draghovering }) => ({
    							6: dragging,
    							7: hovering,
    							8: fade,
    							9: draghovering
    						}),
    						({ dragging, hovering, fade, draghovering }) => (dragging ? 64 : 0) | (hovering ? 128 : 0) | (fade ? 256 : 0) | (draghovering ? 512 : 0)
    					],
    					mover: [
    						create_mover_slot,
    						({ dragging, hovering, fade, draghovering }) => ({
    							6: dragging,
    							7: hovering,
    							8: fade,
    							9: draghovering
    						}),
    						({ dragging, hovering, fade, draghovering }) => (dragging ? 64 : 0) | (hovering ? 128 : 0) | (fade ? 256 : 0) | (draghovering ? 512 : 0)
    					],
    					dropzone: [
    						create_dropzone_slot,
    						({ dragging, hovering, fade, draghovering }) => ({
    							6: dragging,
    							7: hovering,
    							8: fade,
    							9: draghovering
    						}),
    						({ dragging, hovering, fade, draghovering }) => (dragging ? 64 : 0) | (hovering ? 128 : 0) | (fade ? 256 : 0) | (draghovering ? 512 : 0)
    					]
    				},
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			div = element("div");
    			create_component(dragdrop.$$.fragment);
    			attr_dev(div, "class", "token svelte-lbinij");
    			toggle_class(div, "unknown", /*token*/ ctx[0].unknown);
    			add_location(div, file$2, 99, 0, 2110);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			mount_component(dragdrop, div, null);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const dragdrop_changes = {};
    			if (dirty & /*token*/ 1) dragdrop_changes.canDrag = !/*token*/ ctx[0].unknown;

    			if (dirty & /*$$scope, dragging, hovering, draghovering, fade, token, value*/ 1987) {
    				dragdrop_changes.$$scope = { dirty, ctx };
    			}

    			dragdrop.$set(dragdrop_changes);

    			if (dirty & /*token*/ 1) {
    				toggle_class(div, "unknown", /*token*/ ctx[0].unknown);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(dragdrop.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(dragdrop.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_component(dragdrop);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$2.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function handleDropReceive(e) {
    	draftEquation.apply();
    }

    function handleDragLeave(e) {
    	dragdropData.setDrop(null);
    }

    function instance$2($$self, $$props, $$invalidate) {
    	let $dragdropData;
    	validate_store(dragdropData, "dragdropData");
    	component_subscribe($$self, dragdropData, $$value => $$invalidate(5, $dragdropData = $$value));
    	let { token } = $$props;

    	function handleDragStart(e) {
    		dragdropData.setDrag(token);
    	}

    	function handleDragHover(e) {
    		dragdropData.setDrop(token);
    		draftEquation.draftOperation($dragdropData.drag, $dragdropData.drop);
    	}

    	function handleUpdateToken(e) {
    		draftEquation.updateToken(token, e.target.value);
    	}

    	const writable_props = ["token"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Token> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Token", $$slots, []);

    	$$self.$set = $$props => {
    		if ("token" in $$props) $$invalidate(0, token = $$props.token);
    	};

    	$$self.$capture_state = () => ({
    		draftEquation,
    		dragdropData,
    		DragDrop,
    		token,
    		handleDragStart,
    		handleDropReceive,
    		handleDragLeave,
    		handleDragHover,
    		handleUpdateToken,
    		$dragdropData,
    		value
    	});

    	$$self.$inject_state = $$props => {
    		if ("token" in $$props) $$invalidate(0, token = $$props.token);
    		if ("value" in $$props) $$invalidate(1, value = $$props.value);
    	};

    	let value;

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*token*/ 1) {
    			 $$invalidate(1, value = token.value());
    		}
    	};

    	return [token, value, handleDragStart, handleDragHover, handleUpdateToken];
    }

    class Token$1 extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, { token: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Token",
    			options,
    			id: create_fragment$2.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*token*/ ctx[0] === undefined && !("token" in props)) {
    			console.warn("<Token> was created without expected prop 'token'");
    		}
    	}

    	get token() {
    		throw new Error("<Token>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set token(value) {
    		throw new Error("<Token>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\components\Expression.svelte generated by Svelte v3.21.0 */
    const file$3 = "src\\components\\Expression.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[9] = list[i];
    	child_ctx[11] = i;
    	return child_ctx;
    }

    // (83:38) 
    function create_if_block_2(ctx) {
    	let current;

    	const tokencomponent = new Token$1({
    			props: { token: /*item*/ ctx[9] },
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(tokencomponent.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(tokencomponent, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const tokencomponent_changes = {};
    			if (dirty & /*expression*/ 1) tokencomponent_changes.token = /*item*/ ctx[9];
    			tokencomponent.$set(tokencomponent_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(tokencomponent.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(tokencomponent.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(tokencomponent, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2.name,
    		type: "if",
    		source: "(83:38) ",
    		ctx
    	});

    	return block;
    }

    // (81:43) 
    function create_if_block_1$1(ctx) {
    	let current;

    	const expression_1 = new Expression_1({
    			props: { expression: /*item*/ ctx[9] },
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(expression_1.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(expression_1, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const expression_1_changes = {};
    			if (dirty & /*expression*/ 1) expression_1_changes.expression = /*item*/ ctx[9];
    			expression_1.$set(expression_1_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(expression_1.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(expression_1.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(expression_1, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$1.name,
    		type: "if",
    		source: "(81:43) ",
    		ctx
    	});

    	return block;
    }

    // (79:6) {#if item instanceof Operator}
    function create_if_block$2(ctx) {
    	let current;

    	const operatorcomponent = new Operator$1({
    			props: {
    				operator: /*item*/ ctx[9],
    				siblings: /*expression*/ ctx[0].nodes
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(operatorcomponent.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(operatorcomponent, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const operatorcomponent_changes = {};
    			if (dirty & /*expression*/ 1) operatorcomponent_changes.operator = /*item*/ ctx[9];
    			if (dirty & /*expression*/ 1) operatorcomponent_changes.siblings = /*expression*/ ctx[0].nodes;
    			operatorcomponent.$set(operatorcomponent_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(operatorcomponent.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(operatorcomponent.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(operatorcomponent, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$2.name,
    		type: "if",
    		source: "(79:6) {#if item instanceof Operator}",
    		ctx
    	});

    	return block;
    }

    // (78:4) {#each expression.nodes as item, i}
    function create_each_block(ctx) {
    	let current_block_type_index;
    	let if_block;
    	let if_block_anchor;
    	let current;
    	const if_block_creators = [create_if_block$2, create_if_block_1$1, create_if_block_2];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (/*item*/ ctx[9] instanceof Operator) return 0;
    		if (/*item*/ ctx[9] instanceof Expression) return 1;
    		if (/*item*/ ctx[9] instanceof Token) return 2;
    		return -1;
    	}

    	if (~(current_block_type_index = select_block_type(ctx))) {
    		if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    	}

    	const block = {
    		c: function create() {
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if (~current_block_type_index) {
    				if_blocks[current_block_type_index].m(target, anchor);
    			}

    			insert_dev(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type(ctx);

    			if (current_block_type_index === previous_block_index) {
    				if (~current_block_type_index) {
    					if_blocks[current_block_type_index].p(ctx, dirty);
    				}
    			} else {
    				if (if_block) {
    					group_outros();

    					transition_out(if_blocks[previous_block_index], 1, 1, () => {
    						if_blocks[previous_block_index] = null;
    					});

    					check_outros();
    				}

    				if (~current_block_type_index) {
    					if_block = if_blocks[current_block_type_index];

    					if (!if_block) {
    						if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    						if_block.c();
    					}

    					transition_in(if_block, 1);
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				} else {
    					if_block = null;
    				}
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (~current_block_type_index) {
    				if_blocks[current_block_type_index].d(detaching);
    			}

    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(78:4) {#each expression.nodes as item, i}",
    		ctx
    	});

    	return block;
    }

    // (70:2) <div      slot="dropzone"      class="expression no-highlight dropzone"      class:dragging      class:hovering      class:draghovering      class:divide      class:parens={expression.parens}>
    function create_dropzone_slot$1(ctx) {
    	let div;
    	let current;
    	let each_value = /*expression*/ ctx[0].nodes;
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	const out = i => transition_out(each_blocks[i], 1, 1, () => {
    		each_blocks[i] = null;
    	});

    	const block = {
    		c: function create() {
    			div = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(div, "slot", "dropzone");
    			attr_dev(div, "class", "expression no-highlight dropzone svelte-umhtb0");
    			toggle_class(div, "dragging", /*dragging*/ ctx[6]);
    			toggle_class(div, "hovering", /*hovering*/ ctx[7]);
    			toggle_class(div, "draghovering", /*draghovering*/ ctx[8]);
    			toggle_class(div, "divide", /*divide*/ ctx[1]);
    			toggle_class(div, "parens", /*expression*/ ctx[0].parens);
    			add_location(div, file$3, 69, 2, 1682);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div, null);
    			}

    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*expression, Operator, Expression, Token*/ 1) {
    				each_value = /*expression*/ ctx[0].nodes;
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						transition_in(each_blocks[i], 1);
    						each_blocks[i].m(div, null);
    					}
    				}

    				group_outros();

    				for (i = each_value.length; i < each_blocks.length; i += 1) {
    					out(i);
    				}

    				check_outros();
    			}

    			if (dirty & /*dragging*/ 64) {
    				toggle_class(div, "dragging", /*dragging*/ ctx[6]);
    			}

    			if (dirty & /*hovering*/ 128) {
    				toggle_class(div, "hovering", /*hovering*/ ctx[7]);
    			}

    			if (dirty & /*draghovering*/ 256) {
    				toggle_class(div, "draghovering", /*draghovering*/ ctx[8]);
    			}

    			if (dirty & /*divide*/ 2) {
    				toggle_class(div, "divide", /*divide*/ ctx[1]);
    			}

    			if (dirty & /*expression*/ 1) {
    				toggle_class(div, "parens", /*expression*/ ctx[0].parens);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			for (let i = 0; i < each_value.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			current = true;
    		},
    		o: function outro(local) {
    			each_blocks = each_blocks.filter(Boolean);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_each(each_blocks, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_dropzone_slot$1.name,
    		type: "slot",
    		source: "(70:2) <div      slot=\\\"dropzone\\\"      class=\\\"expression no-highlight dropzone\\\"      class:dragging      class:hovering      class:draghovering      class:divide      class:parens={expression.parens}>",
    		ctx
    	});

    	return block;
    }

    function create_fragment$3(ctx) {
    	let current;

    	const dragdrop = new DragDrop({
    			props: {
    				canDrag: false,
    				dropReceive: /*func*/ ctx[3],
    				dragLeave: /*func_1*/ ctx[4],
    				dragHover: /*func_2*/ ctx[5],
    				$$slots: {
    					dropzone: [
    						create_dropzone_slot$1,
    						({ dragging, hovering, draghovering }) => ({
    							6: dragging,
    							7: hovering,
    							8: draghovering
    						}),
    						({ dragging, hovering, draghovering }) => (dragging ? 64 : 0) | (hovering ? 128 : 0) | (draghovering ? 256 : 0)
    					]
    				},
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(dragdrop.$$.fragment);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			mount_component(dragdrop, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const dragdrop_changes = {};
    			if (dirty & /*expression, $dragdropData*/ 5) dragdrop_changes.dragHover = /*func_2*/ ctx[5];

    			if (dirty & /*$$scope, dragging, hovering, draghovering, divide, expression*/ 4547) {
    				dragdrop_changes.$$scope = { dirty, ctx };
    			}

    			dragdrop.$set(dragdrop_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(dragdrop.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(dragdrop.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(dragdrop, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$3.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$3($$self, $$props, $$invalidate) {
    	let $dragdropData;
    	validate_store(dragdropData, "dragdropData");
    	component_subscribe($$self, dragdropData, $$value => $$invalidate(2, $dragdropData = $$value));
    	let { expression } = $$props;
    	const writable_props = ["expression"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Expression> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Expression", $$slots, []);
    	const func = () => draftEquation.apply();

    	const func_1 = () => {
    		dragdropData.setDrop(null);
    	};

    	const func_2 = () => {
    		dragdropData.setDrop(expression);
    		draftEquation.draftOperation($dragdropData.drag, $dragdropData.drop);
    	};

    	$$self.$set = $$props => {
    		if ("expression" in $$props) $$invalidate(0, expression = $$props.expression);
    	};

    	$$self.$capture_state = () => ({
    		afterUpdate,
    		beforeUpdate,
    		Token,
    		Expression,
    		Operator,
    		DivideOperator,
    		ExpressionComponent: Expression_1,
    		OperatorComponent: Operator$1,
    		TokenComponent: Token$1,
    		DragDrop,
    		draftEquation,
    		dragdropData,
    		expression,
    		divide,
    		$dragdropData
    	});

    	$$self.$inject_state = $$props => {
    		if ("expression" in $$props) $$invalidate(0, expression = $$props.expression);
    		if ("divide" in $$props) $$invalidate(1, divide = $$props.divide);
    	};

    	let divide;

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*expression*/ 1) {
    			 $$invalidate(1, divide = expression.nodes[1] instanceof DivideOperator);
    		}
    	};

    	return [expression, divide, $dragdropData, func, func_1, func_2];
    }

    class Expression_1 extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$3, create_fragment$3, safe_not_equal, { expression: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Expression_1",
    			options,
    			id: create_fragment$3.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*expression*/ ctx[0] === undefined && !("expression" in props)) {
    			console.warn("<Expression> was created without expected prop 'expression'");
    		}
    	}

    	get expression() {
    		throw new Error("<Expression>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set expression(value) {
    		throw new Error("<Expression>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\components\Flaggable.svelte generated by Svelte v3.21.0 */

    const file$4 = "src\\components\\Flaggable.svelte";

    function create_fragment$4(ctx) {
    	let div1;
    	let div0;
    	let div0_style_value;
    	let t;
    	let div1_style_value;
    	let current;
    	const default_slot_template = /*$$slots*/ ctx[5].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[4], null);

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			div0 = element("div");
    			t = space();
    			if (default_slot) default_slot.c();
    			attr_dev(div0, "class", "highlight svelte-17mfnby");

    			attr_dev(div0, "style", div0_style_value = `
            border-radius: ${/*hint*/ ctx[1] || /*error*/ ctx[0]
			? /*size*/ ctx[2]
			: 60}%;
            width: ${/*hint*/ ctx[1] || /*error*/ ctx[0]
			? /*size*/ ctx[2] * 0.85
			: 60}%;
            height: ${/*hint*/ ctx[1] || /*error*/ ctx[0]
			? /*size*/ ctx[2]
			: 60}%;
        `);

    			add_location(div0, file$4, 40, 2, 757);
    			attr_dev(div1, "class", "Flaggable svelte-17mfnby");
    			attr_dev(div1, "style", div1_style_value = /*divide*/ ctx[3] ? "width: 100%" : "");
    			toggle_class(div1, "error", /*error*/ ctx[0]);
    			toggle_class(div1, "hint", /*hint*/ ctx[1]);
    			add_location(div1, file$4, 35, 0, 659);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, div0);
    			append_dev(div1, t);

    			if (default_slot) {
    				default_slot.m(div1, null);
    			}

    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (!current || dirty & /*hint, error, size*/ 7 && div0_style_value !== (div0_style_value = `
            border-radius: ${/*hint*/ ctx[1] || /*error*/ ctx[0]
			? /*size*/ ctx[2]
			: 60}%;
            width: ${/*hint*/ ctx[1] || /*error*/ ctx[0]
			? /*size*/ ctx[2] * 0.85
			: 60}%;
            height: ${/*hint*/ ctx[1] || /*error*/ ctx[0]
			? /*size*/ ctx[2]
			: 60}%;
        `)) {
    				attr_dev(div0, "style", div0_style_value);
    			}

    			if (default_slot) {
    				if (default_slot.p && dirty & /*$$scope*/ 16) {
    					default_slot.p(get_slot_context(default_slot_template, ctx, /*$$scope*/ ctx[4], null), get_slot_changes(default_slot_template, /*$$scope*/ ctx[4], dirty, null));
    				}
    			}

    			if (!current || dirty & /*divide*/ 8 && div1_style_value !== (div1_style_value = /*divide*/ ctx[3] ? "width: 100%" : "")) {
    				attr_dev(div1, "style", div1_style_value);
    			}

    			if (dirty & /*error*/ 1) {
    				toggle_class(div1, "error", /*error*/ ctx[0]);
    			}

    			if (dirty & /*hint*/ 2) {
    				toggle_class(div1, "hint", /*hint*/ ctx[1]);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    			if (default_slot) default_slot.d(detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$4.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$4($$self, $$props, $$invalidate) {
    	let { error } = $$props;
    	let { hint } = $$props;
    	let { size } = $$props;
    	let { divide } = $$props;
    	const writable_props = ["error", "hint", "size", "divide"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Flaggable> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Flaggable", $$slots, ['default']);

    	$$self.$set = $$props => {
    		if ("error" in $$props) $$invalidate(0, error = $$props.error);
    		if ("hint" in $$props) $$invalidate(1, hint = $$props.hint);
    		if ("size" in $$props) $$invalidate(2, size = $$props.size);
    		if ("divide" in $$props) $$invalidate(3, divide = $$props.divide);
    		if ("$$scope" in $$props) $$invalidate(4, $$scope = $$props.$$scope);
    	};

    	$$self.$capture_state = () => ({ error, hint, size, divide });

    	$$self.$inject_state = $$props => {
    		if ("error" in $$props) $$invalidate(0, error = $$props.error);
    		if ("hint" in $$props) $$invalidate(1, hint = $$props.hint);
    		if ("size" in $$props) $$invalidate(2, size = $$props.size);
    		if ("divide" in $$props) $$invalidate(3, divide = $$props.divide);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [error, hint, size, divide, $$scope, $$slots];
    }

    class Flaggable extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$4, create_fragment$4, safe_not_equal, { error: 0, hint: 1, size: 2, divide: 3 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Flaggable",
    			options,
    			id: create_fragment$4.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*error*/ ctx[0] === undefined && !("error" in props)) {
    			console.warn("<Flaggable> was created without expected prop 'error'");
    		}

    		if (/*hint*/ ctx[1] === undefined && !("hint" in props)) {
    			console.warn("<Flaggable> was created without expected prop 'hint'");
    		}

    		if (/*size*/ ctx[2] === undefined && !("size" in props)) {
    			console.warn("<Flaggable> was created without expected prop 'size'");
    		}

    		if (/*divide*/ ctx[3] === undefined && !("divide" in props)) {
    			console.warn("<Flaggable> was created without expected prop 'divide'");
    		}
    	}

    	get error() {
    		throw new Error("<Flaggable>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set error(value) {
    		throw new Error("<Flaggable>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get hint() {
    		throw new Error("<Flaggable>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set hint(value) {
    		throw new Error("<Flaggable>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get size() {
    		throw new Error("<Flaggable>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set size(value) {
    		throw new Error("<Flaggable>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get divide() {
    		throw new Error("<Flaggable>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set divide(value) {
    		throw new Error("<Flaggable>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\components\Equation.svelte generated by Svelte v3.21.0 */
    const file$5 = "src\\components\\Equation.svelte";

    // (41:47) 
    function create_if_block_5(ctx) {
    	let current;

    	const tokencomponent = new Token$1({
    			props: { token: /*equation*/ ctx[0].left },
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(tokencomponent.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(tokencomponent, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const tokencomponent_changes = {};
    			if (dirty & /*equation*/ 1) tokencomponent_changes.token = /*equation*/ ctx[0].left;
    			tokencomponent.$set(tokencomponent_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(tokencomponent.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(tokencomponent.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(tokencomponent, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_5.name,
    		type: "if",
    		source: "(41:47) ",
    		ctx
    	});

    	return block;
    }

    // (39:52) 
    function create_if_block_4(ctx) {
    	let current;

    	const expressioncomponent = new Expression_1({
    			props: { expression: /*equation*/ ctx[0].left },
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(expressioncomponent.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(expressioncomponent, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const expressioncomponent_changes = {};
    			if (dirty & /*equation*/ 1) expressioncomponent_changes.expression = /*equation*/ ctx[0].left;
    			expressioncomponent.$set(expressioncomponent_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(expressioncomponent.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(expressioncomponent.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(expressioncomponent, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_4.name,
    		type: "if",
    		source: "(39:52) ",
    		ctx
    	});

    	return block;
    }

    // (37:6) {#if equation.left instanceof Operator}
    function create_if_block_3(ctx) {
    	let current;

    	const operatorcomponent = new Operator$1({
    			props: {
    				operator: /*equation*/ ctx[0].left,
    				siblings: /*equation*/ ctx[0].left
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(operatorcomponent.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(operatorcomponent, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const operatorcomponent_changes = {};
    			if (dirty & /*equation*/ 1) operatorcomponent_changes.operator = /*equation*/ ctx[0].left;
    			if (dirty & /*equation*/ 1) operatorcomponent_changes.siblings = /*equation*/ ctx[0].left;
    			operatorcomponent.$set(operatorcomponent_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(operatorcomponent.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(operatorcomponent.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(operatorcomponent, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_3.name,
    		type: "if",
    		source: "(37:6) {#if equation.left instanceof Operator}",
    		ctx
    	});

    	return block;
    }

    // (33:2) <Flaggable error={error === 'left'} size={110}>
    function create_default_slot_1(ctx) {
    	let div;
    	let current_block_type_index;
    	let if_block;
    	let current;
    	const if_block_creators = [create_if_block_3, create_if_block_4, create_if_block_5];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (/*equation*/ ctx[0].left instanceof Operator) return 0;
    		if (/*equation*/ ctx[0].left instanceof Expression) return 1;
    		if (/*equation*/ ctx[0].left instanceof Token) return 2;
    		return -1;
    	}

    	if (~(current_block_type_index = select_block_type(ctx))) {
    		if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    	}

    	const block = {
    		c: function create() {
    			div = element("div");
    			if (if_block) if_block.c();
    			attr_dev(div, "class", "side left svelte-1c3qqr6");
    			toggle_class(div, "no-exp", !(/*equation*/ ctx[0].right instanceof Expression));
    			add_location(div, file$5, 33, 4, 716);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);

    			if (~current_block_type_index) {
    				if_blocks[current_block_type_index].m(div, null);
    			}

    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type(ctx);

    			if (current_block_type_index === previous_block_index) {
    				if (~current_block_type_index) {
    					if_blocks[current_block_type_index].p(ctx, dirty);
    				}
    			} else {
    				if (if_block) {
    					group_outros();

    					transition_out(if_blocks[previous_block_index], 1, 1, () => {
    						if_blocks[previous_block_index] = null;
    					});

    					check_outros();
    				}

    				if (~current_block_type_index) {
    					if_block = if_blocks[current_block_type_index];

    					if (!if_block) {
    						if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    						if_block.c();
    					}

    					transition_in(if_block, 1);
    					if_block.m(div, null);
    				} else {
    					if_block = null;
    				}
    			}

    			if (dirty & /*equation, Expression*/ 1) {
    				toggle_class(div, "no-exp", !(/*equation*/ ctx[0].right instanceof Expression));
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);

    			if (~current_block_type_index) {
    				if_blocks[current_block_type_index].d();
    			}
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_1.name,
    		type: "slot",
    		source: "(33:2) <Flaggable error={error === 'left'} size={110}>",
    		ctx
    	});

    	return block;
    }

    // (57:48) 
    function create_if_block_2$1(ctx) {
    	let current;

    	const tokencomponent = new Token$1({
    			props: { token: /*equation*/ ctx[0].right },
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(tokencomponent.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(tokencomponent, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const tokencomponent_changes = {};
    			if (dirty & /*equation*/ 1) tokencomponent_changes.token = /*equation*/ ctx[0].right;
    			tokencomponent.$set(tokencomponent_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(tokencomponent.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(tokencomponent.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(tokencomponent, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2$1.name,
    		type: "if",
    		source: "(57:48) ",
    		ctx
    	});

    	return block;
    }

    // (55:53) 
    function create_if_block_1$2(ctx) {
    	let current;

    	const expressioncomponent = new Expression_1({
    			props: { expression: /*equation*/ ctx[0].right },
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(expressioncomponent.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(expressioncomponent, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const expressioncomponent_changes = {};
    			if (dirty & /*equation*/ 1) expressioncomponent_changes.expression = /*equation*/ ctx[0].right;
    			expressioncomponent.$set(expressioncomponent_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(expressioncomponent.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(expressioncomponent.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(expressioncomponent, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$2.name,
    		type: "if",
    		source: "(55:53) ",
    		ctx
    	});

    	return block;
    }

    // (51:6) {#if equation.right instanceof Operator}
    function create_if_block$3(ctx) {
    	let current;

    	const operatorcomponent = new Operator$1({
    			props: {
    				operator: /*equation*/ ctx[0].right,
    				siblings: /*equation*/ ctx[0].right
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(operatorcomponent.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(operatorcomponent, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const operatorcomponent_changes = {};
    			if (dirty & /*equation*/ 1) operatorcomponent_changes.operator = /*equation*/ ctx[0].right;
    			if (dirty & /*equation*/ 1) operatorcomponent_changes.siblings = /*equation*/ ctx[0].right;
    			operatorcomponent.$set(operatorcomponent_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(operatorcomponent.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(operatorcomponent.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(operatorcomponent, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$3.name,
    		type: "if",
    		source: "(51:6) {#if equation.right instanceof Operator}",
    		ctx
    	});

    	return block;
    }

    // (47:2) <Flaggable error={error === 'right'} size={110}>
    function create_default_slot$1(ctx) {
    	let div;
    	let current_block_type_index;
    	let if_block;
    	let current;
    	const if_block_creators = [create_if_block$3, create_if_block_1$2, create_if_block_2$1];
    	const if_blocks = [];

    	function select_block_type_1(ctx, dirty) {
    		if (/*equation*/ ctx[0].right instanceof Operator) return 0;
    		if (/*equation*/ ctx[0].right instanceof Expression) return 1;
    		if (/*equation*/ ctx[0].right instanceof Token) return 2;
    		return -1;
    	}

    	if (~(current_block_type_index = select_block_type_1(ctx))) {
    		if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    	}

    	const block = {
    		c: function create() {
    			div = element("div");
    			if (if_block) if_block.c();
    			attr_dev(div, "class", "side right svelte-1c3qqr6");
    			toggle_class(div, "no-exp", !(/*equation*/ ctx[0].right instanceof Expression));
    			add_location(div, file$5, 47, 4, 1281);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);

    			if (~current_block_type_index) {
    				if_blocks[current_block_type_index].m(div, null);
    			}

    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type_1(ctx);

    			if (current_block_type_index === previous_block_index) {
    				if (~current_block_type_index) {
    					if_blocks[current_block_type_index].p(ctx, dirty);
    				}
    			} else {
    				if (if_block) {
    					group_outros();

    					transition_out(if_blocks[previous_block_index], 1, 1, () => {
    						if_blocks[previous_block_index] = null;
    					});

    					check_outros();
    				}

    				if (~current_block_type_index) {
    					if_block = if_blocks[current_block_type_index];

    					if (!if_block) {
    						if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    						if_block.c();
    					}

    					transition_in(if_block, 1);
    					if_block.m(div, null);
    				} else {
    					if_block = null;
    				}
    			}

    			if (dirty & /*equation, Expression*/ 1) {
    				toggle_class(div, "no-exp", !(/*equation*/ ctx[0].right instanceof Expression));
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);

    			if (~current_block_type_index) {
    				if_blocks[current_block_type_index].d();
    			}
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot$1.name,
    		type: "slot",
    		source: "(47:2) <Flaggable error={error === 'right'} size={110}>",
    		ctx
    	});

    	return block;
    }

    function create_fragment$5(ctx) {
    	let div;
    	let t0;
    	let span;
    	let t2;
    	let current;

    	const flaggable0 = new Flaggable({
    			props: {
    				error: /*error*/ ctx[1] === "left",
    				size: 110,
    				$$slots: { default: [create_default_slot_1] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const flaggable1 = new Flaggable({
    			props: {
    				error: /*error*/ ctx[1] === "right",
    				size: 110,
    				$$slots: { default: [create_default_slot$1] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			div = element("div");
    			create_component(flaggable0.$$.fragment);
    			t0 = space();
    			span = element("span");
    			span.textContent = "=";
    			t2 = space();
    			create_component(flaggable1.$$.fragment);
    			attr_dev(span, "class", "equals svelte-1c3qqr6");
    			add_location(span, file$5, 45, 2, 1194);
    			attr_dev(div, "class", "equation no-highlight svelte-1c3qqr6");
    			add_location(div, file$5, 30, 0, 622);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			mount_component(flaggable0, div, null);
    			append_dev(div, t0);
    			append_dev(div, span);
    			append_dev(div, t2);
    			mount_component(flaggable1, div, null);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const flaggable0_changes = {};
    			if (dirty & /*error*/ 2) flaggable0_changes.error = /*error*/ ctx[1] === "left";

    			if (dirty & /*$$scope, equation*/ 5) {
    				flaggable0_changes.$$scope = { dirty, ctx };
    			}

    			flaggable0.$set(flaggable0_changes);
    			const flaggable1_changes = {};
    			if (dirty & /*error*/ 2) flaggable1_changes.error = /*error*/ ctx[1] === "right";

    			if (dirty & /*$$scope, equation*/ 5) {
    				flaggable1_changes.$$scope = { dirty, ctx };
    			}

    			flaggable1.$set(flaggable1_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(flaggable0.$$.fragment, local);
    			transition_in(flaggable1.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(flaggable0.$$.fragment, local);
    			transition_out(flaggable1.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_component(flaggable0);
    			destroy_component(flaggable1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$5.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$5($$self, $$props, $$invalidate) {
    	let { equation } = $$props;
    	let { error } = $$props;
    	const writable_props = ["equation", "error"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Equation> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Equation", $$slots, []);

    	$$self.$set = $$props => {
    		if ("equation" in $$props) $$invalidate(0, equation = $$props.equation);
    		if ("error" in $$props) $$invalidate(1, error = $$props.error);
    	};

    	$$self.$capture_state = () => ({
    		Token,
    		Expression,
    		Operator,
    		ExpressionComponent: Expression_1,
    		OperatorComponent: Operator$1,
    		TokenComponent: Token$1,
    		Flaggable,
    		equation,
    		error
    	});

    	$$self.$inject_state = $$props => {
    		if ("equation" in $$props) $$invalidate(0, equation = $$props.equation);
    		if ("error" in $$props) $$invalidate(1, error = $$props.error);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [equation, error];
    }

    class Equation$1 extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$5, create_fragment$5, safe_not_equal, { equation: 0, error: 1 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Equation",
    			options,
    			id: create_fragment$5.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*equation*/ ctx[0] === undefined && !("equation" in props)) {
    			console.warn("<Equation> was created without expected prop 'equation'");
    		}

    		if (/*error*/ ctx[1] === undefined && !("error" in props)) {
    			console.warn("<Equation> was created without expected prop 'error'");
    		}
    	}

    	get equation() {
    		throw new Error("<Equation>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set equation(value) {
    		throw new Error("<Equation>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get error() {
    		throw new Error("<Equation>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set error(value) {
    		throw new Error("<Equation>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\components\DraggableOperator.svelte generated by Svelte v3.21.0 */
    const file$6 = "src\\components\\DraggableOperator.svelte";

    // (22:16) {#if !isDivide}
    function create_if_block_1$3(ctx) {
    	let t_value = /*operator*/ ctx[0].symbol + "";
    	let t;

    	const block = {
    		c: function create() {
    			t = text(t_value);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*operator*/ 1 && t_value !== (t_value = /*operator*/ ctx[0].symbol + "")) set_data_dev(t, t_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$3.name,
    		type: "if",
    		source: "(22:16) {#if !isDivide}",
    		ctx
    	});

    	return block;
    }

    // (20:8) <div slot="dropzone" class="operator no-highlight dropzone" class:dragging class:hovering class:draghovering>
    function create_dropzone_slot$2(ctx) {
    	let div0;
    	let div1;
    	let if_block = !/*isDivide*/ ctx[1] && create_if_block_1$3(ctx);

    	const block = {
    		c: function create() {
    			div0 = element("div");
    			div1 = element("div");
    			if (if_block) if_block.c();
    			attr_dev(div1, "class", "no-highlight");
    			toggle_class(div1, "divide", /*isDivide*/ ctx[1]);
    			add_location(div1, file$6, 20, 12, 780);
    			attr_dev(div0, "slot", "dropzone");
    			attr_dev(div0, "class", "operator no-highlight dropzone svelte-1hmbt3l");
    			toggle_class(div0, "dragging", /*dragging*/ ctx[5]);
    			toggle_class(div0, "hovering", /*hovering*/ ctx[6]);
    			toggle_class(div0, "draghovering", /*draghovering*/ ctx[7]);
    			add_location(div0, file$6, 19, 8, 657);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div0, anchor);
    			append_dev(div0, div1);
    			if (if_block) if_block.m(div1, null);
    		},
    		p: function update(ctx, dirty) {
    			if (!/*isDivide*/ ctx[1]) if_block.p(ctx, dirty);

    			if (dirty & /*isDivide*/ 2) {
    				toggle_class(div1, "divide", /*isDivide*/ ctx[1]);
    			}

    			if (dirty & /*dragging*/ 32) {
    				toggle_class(div0, "dragging", /*dragging*/ ctx[5]);
    			}

    			if (dirty & /*hovering*/ 64) {
    				toggle_class(div0, "hovering", /*hovering*/ ctx[6]);
    			}

    			if (dirty & /*draghovering*/ 128) {
    				toggle_class(div0, "draghovering", /*draghovering*/ ctx[7]);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div0);
    			if (if_block) if_block.d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_dropzone_slot$2.name,
    		type: "slot",
    		source: "(20:8) <div slot=\\\"dropzone\\\" class=\\\"operator no-highlight dropzone\\\" class:dragging class:hovering class:draghovering>",
    		ctx
    	});

    	return block;
    }

    // (27:16) {#if !isDivide}
    function create_if_block$4(ctx) {
    	let t_value = /*operator*/ ctx[0].symbol + "";
    	let t;

    	const block = {
    		c: function create() {
    			t = text(t_value);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*operator*/ 1 && t_value !== (t_value = /*operator*/ ctx[0].symbol + "")) set_data_dev(t, t_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$4.name,
    		type: "if",
    		source: "(27:16) {#if !isDivide}",
    		ctx
    	});

    	return block;
    }

    // (25:8) <div slot="mover" class="operator no-highlight mover" class:dragging class:hovering class:draghovering class:fade>
    function create_mover_slot$1(ctx) {
    	let div0;
    	let div1;
    	let if_block = !/*isDivide*/ ctx[1] && create_if_block$4(ctx);

    	const block = {
    		c: function create() {
    			div0 = element("div");
    			div1 = element("div");
    			if (if_block) if_block.c();
    			attr_dev(div1, "class", "no-highlight");
    			toggle_class(div1, "divide", /*isDivide*/ ctx[1]);
    			add_location(div1, file$6, 25, 12, 1059);
    			attr_dev(div0, "slot", "mover");
    			attr_dev(div0, "class", "operator no-highlight mover svelte-1hmbt3l");
    			toggle_class(div0, "dragging", /*dragging*/ ctx[5]);
    			toggle_class(div0, "hovering", /*hovering*/ ctx[6]);
    			toggle_class(div0, "draghovering", /*draghovering*/ ctx[7]);
    			toggle_class(div0, "fade", /*fade*/ ctx[8]);
    			add_location(div0, file$6, 24, 8, 931);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div0, anchor);
    			append_dev(div0, div1);
    			if (if_block) if_block.m(div1, null);
    		},
    		p: function update(ctx, dirty) {
    			if (!/*isDivide*/ ctx[1]) if_block.p(ctx, dirty);

    			if (dirty & /*isDivide*/ 2) {
    				toggle_class(div1, "divide", /*isDivide*/ ctx[1]);
    			}

    			if (dirty & /*dragging*/ 32) {
    				toggle_class(div0, "dragging", /*dragging*/ ctx[5]);
    			}

    			if (dirty & /*hovering*/ 64) {
    				toggle_class(div0, "hovering", /*hovering*/ ctx[6]);
    			}

    			if (dirty & /*draghovering*/ 128) {
    				toggle_class(div0, "draghovering", /*draghovering*/ ctx[7]);
    			}

    			if (dirty & /*fade*/ 256) {
    				toggle_class(div0, "fade", /*fade*/ ctx[8]);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div0);
    			if (if_block) if_block.d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_mover_slot$1.name,
    		type: "slot",
    		source: "(25:8) <div slot=\\\"mover\\\" class=\\\"operator no-highlight mover\\\" class:dragging class:hovering class:draghovering class:fade>",
    		ctx
    	});

    	return block;
    }

    // (12:4) <DragDrop          let:dragging={dragging}          let:hovering={hovering}          let:draghovering={draghovering}          let:fade={fade}          canDragHover={false}          dragStart={() => dragdropData.setDrag(operator)}          dropReceive={() => draftEquation.apply()}>
    function create_default_slot$2(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = space();
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot$2.name,
    		type: "slot",
    		source: "(12:4) <DragDrop          let:dragging={dragging}          let:hovering={hovering}          let:draghovering={draghovering}          let:fade={fade}          canDragHover={false}          dragStart={() => dragdropData.setDrag(operator)}          dropReceive={() => draftEquation.apply()}>",
    		ctx
    	});

    	return block;
    }

    function create_fragment$6(ctx) {
    	let div;
    	let current;

    	const dragdrop = new DragDrop({
    			props: {
    				canDragHover: false,
    				dragStart: /*func*/ ctx[3],
    				dropReceive: /*func_1*/ ctx[4],
    				$$slots: {
    					default: [
    						create_default_slot$2,
    						({ dragging, hovering, draghovering, fade }) => ({
    							5: dragging,
    							6: hovering,
    							7: draghovering,
    							8: fade
    						}),
    						({ dragging, hovering, draghovering, fade }) => (dragging ? 32 : 0) | (hovering ? 64 : 0) | (draghovering ? 128 : 0) | (fade ? 256 : 0)
    					],
    					mover: [
    						create_mover_slot$1,
    						({ dragging, hovering, draghovering, fade }) => ({
    							5: dragging,
    							6: hovering,
    							7: draghovering,
    							8: fade
    						}),
    						({ dragging, hovering, draghovering, fade }) => (dragging ? 32 : 0) | (hovering ? 64 : 0) | (draghovering ? 128 : 0) | (fade ? 256 : 0)
    					],
    					dropzone: [
    						create_dropzone_slot$2,
    						({ dragging, hovering, draghovering, fade }) => ({
    							5: dragging,
    							6: hovering,
    							7: draghovering,
    							8: fade
    						}),
    						({ dragging, hovering, draghovering, fade }) => (dragging ? 32 : 0) | (hovering ? 64 : 0) | (draghovering ? 128 : 0) | (fade ? 256 : 0)
    					]
    				},
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			div = element("div");
    			create_component(dragdrop.$$.fragment);
    			attr_dev(div, "class", "draggable-operator svelte-1hmbt3l");
    			add_location(div, file$6, 10, 0, 328);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			mount_component(dragdrop, div, null);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const dragdrop_changes = {};
    			if (dirty & /*operator*/ 1) dragdrop_changes.dragStart = /*func*/ ctx[3];

    			if (dirty & /*$$scope, dragging, hovering, draghovering, fade, operator*/ 993) {
    				dragdrop_changes.$$scope = { dirty, ctx };
    			}

    			dragdrop.$set(dragdrop_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(dragdrop.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(dragdrop.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_component(dragdrop);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$6.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$6($$self, $$props, $$invalidate) {
    	let { operator } = $$props;
    	let { onlySymbol = false } = $$props;
    	let isDivide = !onlySymbol && operator instanceof DivideOperator;
    	const writable_props = ["operator", "onlySymbol"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<DraggableOperator> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("DraggableOperator", $$slots, []);
    	const func = () => dragdropData.setDrag(operator);
    	const func_1 = () => draftEquation.apply();

    	$$self.$set = $$props => {
    		if ("operator" in $$props) $$invalidate(0, operator = $$props.operator);
    		if ("onlySymbol" in $$props) $$invalidate(2, onlySymbol = $$props.onlySymbol);
    	};

    	$$self.$capture_state = () => ({
    		DragDrop,
    		draftEquation,
    		dragdropData,
    		DivideOperator,
    		operator,
    		onlySymbol,
    		isDivide
    	});

    	$$self.$inject_state = $$props => {
    		if ("operator" in $$props) $$invalidate(0, operator = $$props.operator);
    		if ("onlySymbol" in $$props) $$invalidate(2, onlySymbol = $$props.onlySymbol);
    		if ("isDivide" in $$props) $$invalidate(1, isDivide = $$props.isDivide);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [operator, isDivide, onlySymbol, func, func_1];
    }

    class DraggableOperator extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$6, create_fragment$6, safe_not_equal, { operator: 0, onlySymbol: 2 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "DraggableOperator",
    			options,
    			id: create_fragment$6.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*operator*/ ctx[0] === undefined && !("operator" in props)) {
    			console.warn("<DraggableOperator> was created without expected prop 'operator'");
    		}
    	}

    	get operator() {
    		throw new Error("<DraggableOperator>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set operator(value) {
    		throw new Error("<DraggableOperator>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get onlySymbol() {
    		throw new Error("<DraggableOperator>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set onlySymbol(value) {
    		throw new Error("<DraggableOperator>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\components\display\TokenDisplay.svelte generated by Svelte v3.21.0 */

    const file$7 = "src\\components\\display\\TokenDisplay.svelte";

    function create_fragment$7(ctx) {
    	let div;
    	let span;

    	let t_value = (/*token*/ ctx[0].constant == null
    	? "□"
    	: /*token*/ ctx[0].value()) + "";

    	let t;

    	const block = {
    		c: function create() {
    			div = element("div");
    			span = element("span");
    			t = text(t_value);
    			attr_dev(span, "class", "content");
    			add_location(span, file$7, 1, 4, 33);
    			attr_dev(div, "class", "token-display svelte-tdkd9s");
    			add_location(div, file$7, 0, 0, 0);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, span);
    			append_dev(span, t);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*token*/ 1 && t_value !== (t_value = (/*token*/ ctx[0].constant == null
    			? "□"
    			: /*token*/ ctx[0].value()) + "")) set_data_dev(t, t_value);
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$7.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$7($$self, $$props, $$invalidate) {
    	let { token } = $$props;
    	const writable_props = ["token"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<TokenDisplay> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("TokenDisplay", $$slots, []);

    	$$self.$set = $$props => {
    		if ("token" in $$props) $$invalidate(0, token = $$props.token);
    	};

    	$$self.$capture_state = () => ({ token });

    	$$self.$inject_state = $$props => {
    		if ("token" in $$props) $$invalidate(0, token = $$props.token);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [token];
    }

    class TokenDisplay extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$7, create_fragment$7, safe_not_equal, { token: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "TokenDisplay",
    			options,
    			id: create_fragment$7.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*token*/ ctx[0] === undefined && !("token" in props)) {
    			console.warn("<TokenDisplay> was created without expected prop 'token'");
    		}
    	}

    	get token() {
    		throw new Error("<TokenDisplay>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set token(value) {
    		throw new Error("<TokenDisplay>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\components\display\OperatorDisplay.svelte generated by Svelte v3.21.0 */
    const file$8 = "src\\components\\display\\OperatorDisplay.svelte";

    // (9:4) {#if !isDivide}
    function create_if_block$5(ctx) {
    	let t_value = /*operator*/ ctx[0].symbol + "";
    	let t;

    	const block = {
    		c: function create() {
    			t = text(t_value);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*operator*/ 1 && t_value !== (t_value = /*operator*/ ctx[0].symbol + "")) set_data_dev(t, t_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$5.name,
    		type: "if",
    		source: "(9:4) {#if !isDivide}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$8(ctx) {
    	let div;
    	let if_block = !/*isDivide*/ ctx[1] && create_if_block$5(ctx);

    	const block = {
    		c: function create() {
    			div = element("div");
    			if (if_block) if_block.c();
    			attr_dev(div, "class", "operator-display svelte-1whr8ca");
    			toggle_class(div, "divide", /*isDivide*/ ctx[1]);
    			add_location(div, file$8, 7, 0, 163);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			if (if_block) if_block.m(div, null);
    		},
    		p: function update(ctx, [dirty]) {
    			if (!/*isDivide*/ ctx[1]) if_block.p(ctx, dirty);

    			if (dirty & /*isDivide*/ 2) {
    				toggle_class(div, "divide", /*isDivide*/ ctx[1]);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if (if_block) if_block.d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$8.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$8($$self, $$props, $$invalidate) {
    	let { operator } = $$props;
    	let isDivide = operator instanceof DivideOperator;
    	const writable_props = ["operator"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<OperatorDisplay> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("OperatorDisplay", $$slots, []);

    	$$self.$set = $$props => {
    		if ("operator" in $$props) $$invalidate(0, operator = $$props.operator);
    	};

    	$$self.$capture_state = () => ({ DivideOperator, operator, isDivide });

    	$$self.$inject_state = $$props => {
    		if ("operator" in $$props) $$invalidate(0, operator = $$props.operator);
    		if ("isDivide" in $$props) $$invalidate(1, isDivide = $$props.isDivide);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [operator, isDivide];
    }

    class OperatorDisplay extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$8, create_fragment$8, safe_not_equal, { operator: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "OperatorDisplay",
    			options,
    			id: create_fragment$8.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*operator*/ ctx[0] === undefined && !("operator" in props)) {
    			console.warn("<OperatorDisplay> was created without expected prop 'operator'");
    		}
    	}

    	get operator() {
    		throw new Error("<OperatorDisplay>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set operator(value) {
    		throw new Error("<OperatorDisplay>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\components\display\ExpressionDisplay.svelte generated by Svelte v3.21.0 */
    const file$9 = "src\\components\\display\\ExpressionDisplay.svelte";

    function get_each_context$1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[1] = list[i];
    	child_ctx[3] = i;
    	return child_ctx;
    }

    // (15:40) 
    function create_if_block_2$2(ctx) {
    	let current;

    	const tokendisplay = new TokenDisplay({
    			props: { token: /*item*/ ctx[1] },
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(tokendisplay.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(tokendisplay, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const tokendisplay_changes = {};
    			if (dirty & /*expression*/ 1) tokendisplay_changes.token = /*item*/ ctx[1];
    			tokendisplay.$set(tokendisplay_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(tokendisplay.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(tokendisplay.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(tokendisplay, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2$2.name,
    		type: "if",
    		source: "(15:40) ",
    		ctx
    	});

    	return block;
    }

    // (13:45) 
    function create_if_block_1$4(ctx) {
    	let current;

    	const expressiondisplay = new ExpressionDisplay({
    			props: { expression: /*item*/ ctx[1] },
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(expressiondisplay.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(expressiondisplay, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const expressiondisplay_changes = {};
    			if (dirty & /*expression*/ 1) expressiondisplay_changes.expression = /*item*/ ctx[1];
    			expressiondisplay.$set(expressiondisplay_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(expressiondisplay.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(expressiondisplay.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(expressiondisplay, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$4.name,
    		type: "if",
    		source: "(13:45) ",
    		ctx
    	});

    	return block;
    }

    // (11:8) {#if item instanceof Operator}
    function create_if_block$6(ctx) {
    	let current;

    	const operatordisplay = new OperatorDisplay({
    			props: { operator: /*item*/ ctx[1] },
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(operatordisplay.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(operatordisplay, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const operatordisplay_changes = {};
    			if (dirty & /*expression*/ 1) operatordisplay_changes.operator = /*item*/ ctx[1];
    			operatordisplay.$set(operatordisplay_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(operatordisplay.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(operatordisplay.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(operatordisplay, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$6.name,
    		type: "if",
    		source: "(11:8) {#if item instanceof Operator}",
    		ctx
    	});

    	return block;
    }

    // (10:4) {#each expression.nodes as item, i}
    function create_each_block$1(ctx) {
    	let current_block_type_index;
    	let if_block;
    	let if_block_anchor;
    	let current;
    	const if_block_creators = [create_if_block$6, create_if_block_1$4, create_if_block_2$2];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (/*item*/ ctx[1] instanceof Operator) return 0;
    		if (/*item*/ ctx[1] instanceof Expression) return 1;
    		if (/*item*/ ctx[1] instanceof Token) return 2;
    		return -1;
    	}

    	if (~(current_block_type_index = select_block_type(ctx))) {
    		if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    	}

    	const block = {
    		c: function create() {
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if (~current_block_type_index) {
    				if_blocks[current_block_type_index].m(target, anchor);
    			}

    			insert_dev(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type(ctx);

    			if (current_block_type_index === previous_block_index) {
    				if (~current_block_type_index) {
    					if_blocks[current_block_type_index].p(ctx, dirty);
    				}
    			} else {
    				if (if_block) {
    					group_outros();

    					transition_out(if_blocks[previous_block_index], 1, 1, () => {
    						if_blocks[previous_block_index] = null;
    					});

    					check_outros();
    				}

    				if (~current_block_type_index) {
    					if_block = if_blocks[current_block_type_index];

    					if (!if_block) {
    						if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    						if_block.c();
    					}

    					transition_in(if_block, 1);
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				} else {
    					if_block = null;
    				}
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (~current_block_type_index) {
    				if_blocks[current_block_type_index].d(detaching);
    			}

    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$1.name,
    		type: "each",
    		source: "(10:4) {#each expression.nodes as item, i}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$9(ctx) {
    	let div;
    	let current;
    	let each_value = /*expression*/ ctx[0].nodes;
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$1(get_each_context$1(ctx, each_value, i));
    	}

    	const out = i => transition_out(each_blocks[i], 1, 1, () => {
    		each_blocks[i] = null;
    	});

    	const block = {
    		c: function create() {
    			div = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(div, "class", "expression-display svelte-l6pgmv");
    			toggle_class(div, "divide", /*expression*/ ctx[0].nodes[1] instanceof DivideOperator);
    			toggle_class(div, "parens", /*expression*/ ctx[0].parens);
    			add_location(div, file$9, 8, 0, 254);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div, null);
    			}

    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*expression, Operator, Expression, Token*/ 1) {
    				each_value = /*expression*/ ctx[0].nodes;
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$1(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block$1(child_ctx);
    						each_blocks[i].c();
    						transition_in(each_blocks[i], 1);
    						each_blocks[i].m(div, null);
    					}
    				}

    				group_outros();

    				for (i = each_value.length; i < each_blocks.length; i += 1) {
    					out(i);
    				}

    				check_outros();
    			}

    			if (dirty & /*expression, DivideOperator*/ 1) {
    				toggle_class(div, "divide", /*expression*/ ctx[0].nodes[1] instanceof DivideOperator);
    			}

    			if (dirty & /*expression*/ 1) {
    				toggle_class(div, "parens", /*expression*/ ctx[0].parens);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			for (let i = 0; i < each_value.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			current = true;
    		},
    		o: function outro(local) {
    			each_blocks = each_blocks.filter(Boolean);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_each(each_blocks, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$9.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$9($$self, $$props, $$invalidate) {
    	let { expression } = $$props;
    	const writable_props = ["expression"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<ExpressionDisplay> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("ExpressionDisplay", $$slots, []);

    	$$self.$set = $$props => {
    		if ("expression" in $$props) $$invalidate(0, expression = $$props.expression);
    	};

    	$$self.$capture_state = () => ({
    		TokenDisplay,
    		OperatorDisplay,
    		Token,
    		Expression,
    		Operator,
    		DivideOperator,
    		expression
    	});

    	$$self.$inject_state = $$props => {
    		if ("expression" in $$props) $$invalidate(0, expression = $$props.expression);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [expression];
    }

    class ExpressionDisplay extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$9, create_fragment$9, safe_not_equal, { expression: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "ExpressionDisplay",
    			options,
    			id: create_fragment$9.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*expression*/ ctx[0] === undefined && !("expression" in props)) {
    			console.warn("<ExpressionDisplay> was created without expected prop 'expression'");
    		}
    	}

    	get expression() {
    		throw new Error("<ExpressionDisplay>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set expression(value) {
    		throw new Error("<ExpressionDisplay>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\components\History.svelte generated by Svelte v3.21.0 */
    const file$a = "src\\components\\History.svelte";

    function get_each_context$2(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[4] = list[i];
    	child_ctx[6] = i;
    	return child_ctx;
    }

    // (23:44) 
    function create_if_block_5$1(ctx) {
    	let current;

    	const tokendisplay = new TokenDisplay({
    			props: {
    				token: /*item*/ ctx[4].left,
    				path: "left"
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(tokendisplay.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(tokendisplay, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const tokendisplay_changes = {};
    			if (dirty & /*parsedHistory*/ 2) tokendisplay_changes.token = /*item*/ ctx[4].left;
    			tokendisplay.$set(tokendisplay_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(tokendisplay.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(tokendisplay.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(tokendisplay, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_5$1.name,
    		type: "if",
    		source: "(23:44) ",
    		ctx
    	});

    	return block;
    }

    // (21:49) 
    function create_if_block_4$1(ctx) {
    	let current;

    	const expressiondisplay = new ExpressionDisplay({
    			props: {
    				expression: /*item*/ ctx[4].left,
    				path: "left",
    				parentDivide: false
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(expressiondisplay.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(expressiondisplay, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const expressiondisplay_changes = {};
    			if (dirty & /*parsedHistory*/ 2) expressiondisplay_changes.expression = /*item*/ ctx[4].left;
    			expressiondisplay.$set(expressiondisplay_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(expressiondisplay.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(expressiondisplay.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(expressiondisplay, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_4$1.name,
    		type: "if",
    		source: "(21:49) ",
    		ctx
    	});

    	return block;
    }

    // (19:7) {#if item.left instanceof Operator}
    function create_if_block_3$1(ctx) {
    	let current;

    	const operatordisplay = new OperatorDisplay({
    			props: {
    				operator: /*item*/ ctx[4].left,
    				path: "left"
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(operatordisplay.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(operatordisplay, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const operatordisplay_changes = {};
    			if (dirty & /*parsedHistory*/ 2) operatordisplay_changes.operator = /*item*/ ctx[4].left;
    			operatordisplay.$set(operatordisplay_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(operatordisplay.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(operatordisplay.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(operatordisplay, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_3$1.name,
    		type: "if",
    		source: "(19:7) {#if item.left instanceof Operator}",
    		ctx
    	});

    	return block;
    }

    // (33:45) 
    function create_if_block_2$3(ctx) {
    	let current;

    	const tokendisplay = new TokenDisplay({
    			props: {
    				token: /*item*/ ctx[4].right,
    				path: "right"
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(tokendisplay.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(tokendisplay, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const tokendisplay_changes = {};
    			if (dirty & /*parsedHistory*/ 2) tokendisplay_changes.token = /*item*/ ctx[4].right;
    			tokendisplay.$set(tokendisplay_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(tokendisplay.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(tokendisplay.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(tokendisplay, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2$3.name,
    		type: "if",
    		source: "(33:45) ",
    		ctx
    	});

    	return block;
    }

    // (31:50) 
    function create_if_block_1$5(ctx) {
    	let current;

    	const expressiondisplay = new ExpressionDisplay({
    			props: {
    				expression: /*item*/ ctx[4].right,
    				path: "right",
    				parentDivide: false
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(expressiondisplay.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(expressiondisplay, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const expressiondisplay_changes = {};
    			if (dirty & /*parsedHistory*/ 2) expressiondisplay_changes.expression = /*item*/ ctx[4].right;
    			expressiondisplay.$set(expressiondisplay_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(expressiondisplay.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(expressiondisplay.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(expressiondisplay, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$5.name,
    		type: "if",
    		source: "(31:50) ",
    		ctx
    	});

    	return block;
    }

    // (29:7) {#if item.right instanceof Operator}
    function create_if_block$7(ctx) {
    	let current;

    	const operatordisplay = new OperatorDisplay({
    			props: {
    				operator: /*item*/ ctx[4].right,
    				path: "right"
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(operatordisplay.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(operatordisplay, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const operatordisplay_changes = {};
    			if (dirty & /*parsedHistory*/ 2) operatordisplay_changes.operator = /*item*/ ctx[4].right;
    			operatordisplay.$set(operatordisplay_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(operatordisplay.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(operatordisplay.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(operatordisplay, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$7.name,
    		type: "if",
    		source: "(29:7) {#if item.right instanceof Operator}",
    		ctx
    	});

    	return block;
    }

    // (15:3) {#each parsedHistory as item, i}
    function create_each_block$2(ctx) {
    	let div5;
    	let div4;
    	let div0;
    	let current_block_type_index;
    	let if_block0;
    	let t0;
    	let div2;
    	let div1;
    	let t2;
    	let div3;
    	let current_block_type_index_1;
    	let if_block1;
    	let t3;
    	let current;
    	const if_block_creators = [create_if_block_3$1, create_if_block_4$1, create_if_block_5$1];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (/*item*/ ctx[4].left instanceof Operator) return 0;
    		if (/*item*/ ctx[4].left instanceof Expression) return 1;
    		if (/*item*/ ctx[4].left instanceof Token) return 2;
    		return -1;
    	}

    	if (~(current_block_type_index = select_block_type(ctx))) {
    		if_block0 = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    	}

    	const if_block_creators_1 = [create_if_block$7, create_if_block_1$5, create_if_block_2$3];
    	const if_blocks_1 = [];

    	function select_block_type_1(ctx, dirty) {
    		if (/*item*/ ctx[4].right instanceof Operator) return 0;
    		if (/*item*/ ctx[4].right instanceof Expression) return 1;
    		if (/*item*/ ctx[4].right instanceof Token) return 2;
    		return -1;
    	}

    	if (~(current_block_type_index_1 = select_block_type_1(ctx))) {
    		if_block1 = if_blocks_1[current_block_type_index_1] = if_block_creators_1[current_block_type_index_1](ctx);
    	}

    	const block = {
    		c: function create() {
    			div5 = element("div");
    			div4 = element("div");
    			div0 = element("div");
    			if (if_block0) if_block0.c();
    			t0 = space();
    			div2 = element("div");
    			div1 = element("div");
    			div1.textContent = "=";
    			t2 = space();
    			div3 = element("div");
    			if (if_block1) if_block1.c();
    			t3 = space();
    			attr_dev(div0, "class", "left svelte-17ube68");
    			add_location(div0, file$a, 17, 6, 670);
    			attr_dev(div1, "class", "svelte-17ube68");
    			add_location(div1, file$a, 26, 26, 1096);
    			attr_dev(div2, "class", "equals svelte-17ube68");
    			add_location(div2, file$a, 26, 6, 1076);
    			attr_dev(div3, "class", "right svelte-17ube68");
    			add_location(div3, file$a, 27, 6, 1122);
    			attr_dev(div4, "class", "equation svelte-17ube68");
    			add_location(div4, file$a, 16, 5, 640);
    			attr_dev(div5, "class", "equation-display svelte-17ube68");
    			toggle_class(div5, "current", /*i*/ ctx[6] === /*$history*/ ctx[2].index);
    			add_location(div5, file$a, 15, 4, 568);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div5, anchor);
    			append_dev(div5, div4);
    			append_dev(div4, div0);

    			if (~current_block_type_index) {
    				if_blocks[current_block_type_index].m(div0, null);
    			}

    			append_dev(div4, t0);
    			append_dev(div4, div2);
    			append_dev(div2, div1);
    			append_dev(div4, t2);
    			append_dev(div4, div3);

    			if (~current_block_type_index_1) {
    				if_blocks_1[current_block_type_index_1].m(div3, null);
    			}

    			append_dev(div5, t3);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type(ctx);

    			if (current_block_type_index === previous_block_index) {
    				if (~current_block_type_index) {
    					if_blocks[current_block_type_index].p(ctx, dirty);
    				}
    			} else {
    				if (if_block0) {
    					group_outros();

    					transition_out(if_blocks[previous_block_index], 1, 1, () => {
    						if_blocks[previous_block_index] = null;
    					});

    					check_outros();
    				}

    				if (~current_block_type_index) {
    					if_block0 = if_blocks[current_block_type_index];

    					if (!if_block0) {
    						if_block0 = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    						if_block0.c();
    					}

    					transition_in(if_block0, 1);
    					if_block0.m(div0, null);
    				} else {
    					if_block0 = null;
    				}
    			}

    			let previous_block_index_1 = current_block_type_index_1;
    			current_block_type_index_1 = select_block_type_1(ctx);

    			if (current_block_type_index_1 === previous_block_index_1) {
    				if (~current_block_type_index_1) {
    					if_blocks_1[current_block_type_index_1].p(ctx, dirty);
    				}
    			} else {
    				if (if_block1) {
    					group_outros();

    					transition_out(if_blocks_1[previous_block_index_1], 1, 1, () => {
    						if_blocks_1[previous_block_index_1] = null;
    					});

    					check_outros();
    				}

    				if (~current_block_type_index_1) {
    					if_block1 = if_blocks_1[current_block_type_index_1];

    					if (!if_block1) {
    						if_block1 = if_blocks_1[current_block_type_index_1] = if_block_creators_1[current_block_type_index_1](ctx);
    						if_block1.c();
    					}

    					transition_in(if_block1, 1);
    					if_block1.m(div3, null);
    				} else {
    					if_block1 = null;
    				}
    			}

    			if (dirty & /*$history*/ 4) {
    				toggle_class(div5, "current", /*i*/ ctx[6] === /*$history*/ ctx[2].index);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block0);
    			transition_in(if_block1);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block0);
    			transition_out(if_block1);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div5);

    			if (~current_block_type_index) {
    				if_blocks[current_block_type_index].d();
    			}

    			if (~current_block_type_index_1) {
    				if_blocks_1[current_block_type_index_1].d();
    			}
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$2.name,
    		type: "each",
    		source: "(15:3) {#each parsedHistory as item, i}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$a(ctx) {
    	let div1;
    	let div0;
    	let current;
    	let each_value = /*parsedHistory*/ ctx[1];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$2(get_each_context$2(ctx, each_value, i));
    	}

    	const out = i => transition_out(each_blocks[i], 1, 1, () => {
    		each_blocks[i] = null;
    	});

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			div0 = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(div0, "class", "stack svelte-17ube68");
    			add_location(div0, file$a, 13, 4, 490);
    			attr_dev(div1, "class", "History svelte-17ube68");
    			add_location(div1, file$a, 12, 0, 463);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, div0);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div0, null);
    			}

    			/*div0_binding*/ ctx[3](div0);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*$history, parsedHistory, Operator, Expression, Token*/ 6) {
    				each_value = /*parsedHistory*/ ctx[1];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$2(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block$2(child_ctx);
    						each_blocks[i].c();
    						transition_in(each_blocks[i], 1);
    						each_blocks[i].m(div0, null);
    					}
    				}

    				group_outros();

    				for (i = each_value.length; i < each_blocks.length; i += 1) {
    					out(i);
    				}

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			for (let i = 0; i < each_value.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			current = true;
    		},
    		o: function outro(local) {
    			each_blocks = each_blocks.filter(Boolean);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    			destroy_each(each_blocks, detaching);
    			/*div0_binding*/ ctx[3](null);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$a.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$a($$self, $$props, $$invalidate) {
    	let $history;
    	validate_store(history, "history");
    	component_subscribe($$self, history, $$value => $$invalidate(2, $history = $$value));
    	let ref;
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<History> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("History", $$slots, []);

    	function div0_binding($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			$$invalidate(0, ref = $$value);
    		});
    	}

    	$$self.$capture_state = () => ({
    		history,
    		ExpressionDisplay,
    		OperatorDisplay,
    		TokenDisplay,
    		Operator,
    		Expression,
    		Token,
    		parseGrammar,
    		ref,
    		parsedHistory,
    		$history
    	});

    	$$self.$inject_state = $$props => {
    		if ("ref" in $$props) $$invalidate(0, ref = $$props.ref);
    		if ("parsedHistory" in $$props) $$invalidate(1, parsedHistory = $$props.parsedHistory);
    	};

    	let parsedHistory;

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*$history*/ 4) {
    			 $$invalidate(1, parsedHistory = $history.all.map(item => parseGrammar(item)));
    		}
    	};

    	return [ref, parsedHistory, $history, div0_binding];
    }

    class History extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$a, create_fragment$a, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "History",
    			options,
    			id: create_fragment$a.name
    		});
    	}
    }

    /* src\components\menu\Buttons.svelte generated by Svelte v3.21.0 */

    const file$b = "src\\components\\menu\\Buttons.svelte";

    // (75:2) {#if error}
    function create_if_block$8(ctx) {
    	let div2;
    	let button;
    	let div0;
    	let t1;
    	let div1;
    	let dispose;

    	const block = {
    		c: function create() {
    			div2 = element("div");
    			button = element("button");
    			div0 = element("div");
    			div0.textContent = "⮌";
    			t1 = space();
    			div1 = element("div");
    			div1.textContent = "Undo";
    			attr_dev(div0, "class", "icon");
    			add_location(div0, file$b, 77, 8, 1507);
    			attr_dev(div1, "class", "content");
    			add_location(div1, file$b, 78, 8, 1542);
    			attr_dev(button, "class", "svelte-1cy6v0m");
    			add_location(button, file$b, 76, 6, 1471);
    			attr_dev(div2, "class", "UndoButton button svelte-1cy6v0m");
    			add_location(div2, file$b, 75, 4, 1432);
    		},
    		m: function mount(target, anchor, remount) {
    			insert_dev(target, div2, anchor);
    			append_dev(div2, button);
    			append_dev(button, div0);
    			append_dev(button, t1);
    			append_dev(button, div1);
    			if (remount) dispose();

    			dispose = listen_dev(
    				button,
    				"click",
    				function () {
    					if (is_function(/*onUndo*/ ctx[0])) /*onUndo*/ ctx[0].apply(this, arguments);
    				},
    				false,
    				false,
    				false
    			);
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div2);
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$8.name,
    		type: "if",
    		source: "(75:2) {#if error}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$b(ctx) {
    	let div2;
    	let t0;
    	let div0;
    	let t1;
    	let div1;
    	let if_block = /*error*/ ctx[1] && create_if_block$8(ctx);

    	const block = {
    		c: function create() {
    			div2 = element("div");
    			if (if_block) if_block.c();
    			t0 = space();
    			div0 = element("div");
    			t1 = space();
    			div1 = element("div");
    			attr_dev(div0, "class", "CTATHintButton button svelte-1cy6v0m");
    			add_location(div0, file$b, 82, 2, 1615);
    			attr_dev(div1, "class", "CTATDoneButton button svelte-1cy6v0m");
    			add_location(div1, file$b, 83, 2, 1656);
    			add_location(div2, file$b, 73, 0, 1406);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div2, anchor);
    			if (if_block) if_block.m(div2, null);
    			append_dev(div2, t0);
    			append_dev(div2, div0);
    			append_dev(div2, t1);
    			append_dev(div2, div1);
    		},
    		p: function update(ctx, [dirty]) {
    			if (/*error*/ ctx[1]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block$8(ctx);
    					if_block.c();
    					if_block.m(div2, t0);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div2);
    			if (if_block) if_block.d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$b.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$b($$self, $$props, $$invalidate) {
    	let { onUndo } = $$props;
    	let { error } = $$props;
    	const writable_props = ["onUndo", "error"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Buttons> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Buttons", $$slots, []);

    	$$self.$set = $$props => {
    		if ("onUndo" in $$props) $$invalidate(0, onUndo = $$props.onUndo);
    		if ("error" in $$props) $$invalidate(1, error = $$props.error);
    	};

    	$$self.$capture_state = () => ({ onUndo, error });

    	$$self.$inject_state = $$props => {
    		if ("onUndo" in $$props) $$invalidate(0, onUndo = $$props.onUndo);
    		if ("error" in $$props) $$invalidate(1, error = $$props.error);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [onUndo, error];
    }

    class Buttons extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$b, create_fragment$b, safe_not_equal, { onUndo: 0, error: 1 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Buttons",
    			options,
    			id: create_fragment$b.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*onUndo*/ ctx[0] === undefined && !("onUndo" in props)) {
    			console.warn("<Buttons> was created without expected prop 'onUndo'");
    		}

    		if (/*error*/ ctx[1] === undefined && !("error" in props)) {
    			console.warn("<Buttons> was created without expected prop 'error'");
    		}
    	}

    	get onUndo() {
    		throw new Error("<Buttons>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set onUndo(value) {
    		throw new Error("<Buttons>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get error() {
    		throw new Error("<Buttons>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set error(value) {
    		throw new Error("<Buttons>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    const img = "data:image/png;base64,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";

    const img$1 = "data:image/png;base64,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";

    const img$2 = "data:image/png;base64,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";

    const img$3 = "data:image/png;base64,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";

    const img$4 = "data:image/png;base64,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gQUAEBNYAAAxgQUAEBNYAAAxgQUAEBNYAAAxgQUAEBNYAAAxgQUAEBNYAAAxgQUAEBNYAAAxgQUAEBNYAAAxgQUAEBNYAAAxgQUAEBNYAAAxgQUAEBNYAAAxgQUAEBNYAAAxgQUAEBNYAAAxgQUAEBNYAAAxgQUAEBNYAAAxgQUAEBNYAAAxgQUAEBNYAAAxgQUAEBNYAAAxgQUAEBNYAAAxgQUAEBNYAAAxgQUAEBNYAAAxgQUAEBNYAAAxgQUAEBNYAAAxgQUAEBNYAAAxgQUAEBNYAAAxgQUAEBNYAAAxgQUAEBNYAAAxgQUAEBNYAAAxgQUAEBNYAAAxgQUAEBNYAAAxgQUAEBNYAAAxgQUAEBNYAAAxgQUAEBNYAAAxgQUAEBNYAAAxgQUAEBNYAAAxgQUAEBNYAAAxgQUAEBNYAAAxgQUAEBNYAAAxgQUAEBNYAAAxgQUAEBNYAAAxgQUAEBNYAAAxgQUAEBNYAAAxgQUAEBNYAAAxgQUAEBNYAAAxgQUAEBNYAAAxgQUAEBNYAAAxgQUAEBNYAAAxgQUAEBNYAAAxgQUAEBNYAAAxgQUAEBNYAAAxgQUAEBNYAAAxgQUAEBNYAAAxgQUAEBNYAAAxgQUAEBNYAAAxgQUAEBNYAAAxgQUAEBNYAAAxgQUAEBNYAAAxgQUAEBNYAAAxgQUAEBNYAAAxgQUAEBNYAAAxgQUAEBNYAAAxgQUAEBNYAAAxgQUAEBNYAAAxgQUAEBNYAAAxgQUAEBNYAAAxgQUAEBNYAAAxgQUAEBNYAAAxgQUAEBNYAAAxgQUAEBNYAAAxgQUAEBNYAAAxgQUAEBNYAAAxgQUAEBNYAAAxgQUAEBNYAAAxgQUAEBNYAAAxgQUAEBNYAAAxgQUAEBNYAAAxgQUAEBNYAAAxgQUAEBNYAAAxgQUAEBNYAAAxgQUAEBNYAAAxgQUAEBNYAAAxgQUAEBNYAAAxgQUAEBNYAAAxgQUAEBNYAAAxgQUAEBNYAAAxgQUAEBNYAAAxgQUAEBNYAAAxgQUAEBNYAAAxgQUAEBNYAAAxgQUAEBNYAAAxgQUAEBNYAAAxgQUAEBNYAAAxgQUAEBNYAAAxgQUAEBNYAAAxgQUAEBNYAAAxgQUAEBNYAAAxgQUAEBNYAAAxgQUAEBNYAAAxgQUAEBNYAAAxgQUAEBNYAAAxgQUAEBNYAAAxgQUAEBNYAAAxgQUAEBNYAAAxgQUAEBNYAAAxgQUAEBNYAAAxgQUAEBNYAAAxgQUAEBNYAAAxgQUAEBNYAAAxgQUAEBNYAAClMcZ/AUvlLCleffE7AAAAAElFTkSuQmCC";

    const img$5 = "data:image/png;base64,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LWFy9sXw0c0i+IunXnd1x4T5zSO7N5vHm19sc7rs/4+PuGs/WIMGx0dgAQdhmlabO1U/33EsbzehtUTVm/hO1dcILDhC1mABh+LVPY7jpzHGP8YYf36iY74SV3CcjGkADsV91zk9VVz9aoE7HC93sIBDcb48+tvl2367ullC7sNnA1e/vEP13mgGwBos4GAsC93/FS1av15i6t3yKZyAexNYwMFZvt34ZplFtYurZUDoZqzDQ14JBPB/Ags4WNO02jwy/Pcdx3ezPF68EFVARWABB22aVh+2jGN4u8zH8ugPSPkWIXDott2VuhBXwGMQWMCh+/JlzACPTmABB2uaVne9V9CaK+BRCCzgkJ1vObZri9qBxyKwgIM0TavNPKzvthzbpSsPPBaBBRyqszuOa9vdLYDfRWABh2rb2qu3Hg8Cj0lgAYfq6ivHdbNMeQd4NAILOFRfi6gzs6+Ax2aSO3CwPnv58+bdhJuoOp/n9TtXHHhsAgsAIOYRIQBATGABAMQEFgBATGABAMQEFgBATGABAMQEFgBATGABAMQEFgBATGABAMQEFgBATGABAMQEFgBATGABAMQEFgBATGABAMQEFgBATGABAMQEFgBATGABAMQEFgBATGABAMQEFgBATGABAMQEFgBATGABAMQEFgBATGABAMQEFgBATGABAMQEFgBATGABAMQEFgBATGABAMQEFgBATGABAMQEFgBATGABAMQEFgBATGABAMQEFgBATGABAMQEFgBATGABAMQEFgBATGABAMQEFgBATGABAMQEFgBATGABAMQEFgBATGABAMQEFgBATGABAMQEFgBATGABAMQEFgBATGABAMQEFgBATGABAMQEFgBATGABAMQEFgBATGABAMQEFgBATGABAMQEFgBATGABAMQEFgBATGABAMQEFgBATGABAMQEFgBATGABAMQEFgBATGABAMQEFgBATGABAMQEFgBATGABAMQEFgBATGABAMQEFgBATGABAMQEFgBATGABAMQEFgBATGABAMQEFgBATGABAMQEFgBATGABAMQEFgBATGABAMQEFgBATGABAMQEFgBATGABAMQEFgBATGABAMQEFgBATGABAMQEFgBATGABAMQEFgBATGABAMQEFgBATGABAMQEFgBATGABAMQEFgBATGABAMQEFgBATGABAMQEFgBATGABAMQEFgBATGABAMQEFgBATGABAMQEFgBATGABAMQEFgBATGABAMQEFgBATGABAMQEFgBATGABAMQEFgBATGABAMQEFgBATGABAMQEFgBATGABAMQEFgBATGABAMQEFgBATGABAMQEFgBATGABAMQEFgBATGABAMQEFgBATGABAMQEFgBATGABAMQEFgBATGABAMQEFgBATGABAMQEFgBATGABAMQEFgBATGABAMQEFgBATGABAMQEFgBATGABAMQEFgBATGABAMQEFgBATGABAMQEFgBATGABAMQEFgBATGABAMQEFgBATGABAMQEFgBATGABAMQEFgBATGABAMQEFgBATGABAMQEFgBATGABAMQEFgBATGABAMQEFgBATGABAMQEFgBATGABAMQEFgBATGABAMQEFgBATGABAMQEFgBATGABAMQEFgBATGABAMQEFgBATGABAMQEFgBATGABAMQEFgBATGABAMQEFgBATGABAMQEFgBATGABAMQEFgBATGABAMQEFgBATGABAMQEFgBATGABAMQEFgBATGABAMQEFgBATGABAMQEFgBATGABAMQEFgBATGABAMQEFgBATGABAMQEFgBATGABAMQEFgBATGABAMQEFgBATGABAMQEFgBATGABAMQEFgBATGABAMQEFgBATGABAMQEFgBATGABAMQEFgBATGABAMQEFgBATGABAMQEFgBATGABAMQEFgBATGABAMQEFgBATGABAMQEFgBATGABAMQEFgBATGABAMQEFgBATGABAMQEFgBATGABAMQEFgBATGABAMQEFgBATGABAMQEFgBATGABAMQEFgBATGABAMQEFgBATGABAMQEFgBATGABAMQEFgBATGABAMQEFgBATGABAMQEFgBATGABAMQEFgBATGABAMQEFgBATGABAMQEFgBATGABAMQEFgBATGABAMQEFgBATGABAMQEFgBATGABAMQEFgBATGABAMQEFgBATGABAMQEFgBATGABAMQEFgBATGABAMQEFgBATGABAMQEFgBATGABAMQEFgBATGABAMQEFgBATGABAMQEFgBATGABAMQEFgBATGABAMQEFgBATGABAMQEFgBATGABAMQEFgBATGABAMQEFgBATGABAMQEFgBAaYzxP+xkBup76yAmAAAAAElFTkSuQmCC";

    const img$6 = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAlgAAAJYCAYAAAC+ZpjcAAAACXBIWXMAAAsSAAALEgHS3X78AAANuklEQVR4nO3dzW0cyQGA0ZKxd8sRiBksbw3MRQyBjsDcCMwQHAIVgbkZaDOQLgP0aaUMpAykCGgM0GsQhlfiUB85f+8BA0nADFWsvnyorql+cXd3NwAA6PzFXAIAtAQWAEBMYAEAxAQWAEBMYAEAxAQWAEBMYAEAxAQWAEBMYAEAxAQWAEBMYAEAxAQWAEBMYAEAxAQWAEBMYAEAxAQWAEBMYAEAxAQWAEBMYAEAxAQWAEBMYAEAxAQWAEBMYAEAxAQWAEBMYAEAxAQWAEBMYAEAxAQWAEBMYAEAxAQWAEBMYAEAxAQWAEBMYAEAxAQWAEBMYAEAxAQWAEBMYAEAxAQWAEBMYAEAxAQWAEBMYAEAxAQWAEBMYAEAxAQWAEBMYAEAxAQWAEBMYAEAxAQWAEBMYAEAxAQWAEBMYAEAxAQWAEBMYAEAxAQWAEBMYAEAxAQWAEBMYAEAxAQWAEBMYAEAxAQWAEBMYAEAxAQWAEBMYAEAxAQWAEBMYAEAxAQWAEBMYAEAxAQWAEBMYAEAxAQWAEBMYAEAxAQWAEBMYAEAxAQWAEBMYAEAxAQWAEBMYAEAxAQWAEBMYAEAxAQWAEBMYAEAxAQWAEBMYAEAxAQWAEBMYAEAxAQWAEBMYAEAxAQWAEBMYAEAxAQWAEBMYAEAxAQWAEBMYAEAxAQWAEBMYAEAxAQWAEBMYAEAxAQWAEBMYAEAxAQWAEBMYAEAxAQWAEBMYAEAxAQWAEBMYAEAxAQWAEBMYAEAxAQWAEBMYAEAxAQWAEBMYAEAxAQWAEBMYAEAxAQWAEBMYAEAxAQWAEBMYAEAxAQWAEBMYAEAxAQWAEBMYAEAxAQWAEBMYAEAxAQWAEBMYAEAxAQWAEBMYAEAxAQWAEBMYAEAxAQWAEBMYAEAxAQWAEBMYAEAxAQWAEBMYAEAxAQWAEBMYAEAxAQWAEBMYAEAxAQWAEBMYAEAxAQWAEBMYAEAxAQWAEBMYAEAxAQWAEBMYAEAxAQWAEBMYAEAxAQWAEBMYAEAxAQWAEBMYAEAxAQWAEBMYAEAxAQWAEBMYAEAxAQWAEBMYAEAxAQWAEBMYAEAxAQWAEBMYAEAxAQWAEBMYAEAxAQWAEBMYAEAxAQWAEBMYAEAxAQWAEBMYAEAxAQWAEBMYAEAxAQWAEBMYAEAxAQWAEBMYAEAxAQWAEBMYAEAxAQWAEBMYAEAxAQWAEBMYAEAxAQWAEBMYAEAxAQWAEBMYAEAxAQWAEBMYAEAxAQWAEBMYAEAxAQWAEBMYAEAxAQWAEBMYAEAxAQWAEBMYAEAxAQWAEBMYAEAxAQWAEBMYAEAxAQWAEBMYAEAxAQWAEBMYAEAxAQWAEBMYAEAxAQWAEBMYAEAxAQWAEBMYAEAxAQWAEBMYAEAxAQWAEBMYAEAxAQWAEBMYAEAxAQWAEBMYAEAxAQWAEBMYAEAxAQWAEBMYAEAxAQWAEBMYAEAxAQWAEBMYAEAxAQWAEBMYAEAxAQWAEBMYAEAxH4yoQCHZZpWF2OMqzHG2Rjjyxjj3Rjjdp7XX1xK2A8v7u7uXAqAAzFNq9sxxj/+z2g/jzEu53n9wbWE3RNYAAdimlY3Y4x/fmO0m8g6t5IFu2cPFsABmKbV2XfiauPVGOPa9YTdE1gAh+HygaO8cj1h9wQWwGF4+cBRvnI9YfcEFgBATGABHAYb1+GACCyAw/D2gaP8zfWE3RNYAAdgntefHhhPN64n7J7AAjgcm28IfvzGaN/M8/qd6wm7J7AADsRygOjmMTlvxhhf7416c8Do3+d57Qws2BNOcgcAiFnBAgCICSwAgJjAAgCICSwAgJjAAgCICSwAgJjAAgCICSwAgJjAAgCICSwAgJjAAgCICSwAgJjAAgCICSwAgNhPJhT4EdO0uhpjbF6vlx/zfozxdp7XN8c8sdO0OhtjnC3/vP/3l2OM83tv3fz90/K6mef1ux0MF3hmL+7u7sw5sLVpWm3C4XaM8fOffPbjJrzmef3hUGd3mlYX9+Lp/F48/fUHfuxvy7x8CYcK7BmBBWxtWb358IDQ+LqJk0OIiSUYL5aAOv9GOBbez/P64vl+O+C5uUUIPMbtA1dxNu+5WW4h7pUlqC6XqHr9zGN7vbm1Os/r232bF6BhBQvYyhImv2/5sb/tehVrmlYv7wXV5Q/e5itYxYIjZgUL2NblIz/z7Ks1y63My+X13KtU37Nv4wFCAgvY1mNWXc4e8J7EElVXS1Q95T4qgD8lsICjsRwZcbMHt/8e4uv+DxF4LIEFHIVpWm1WrP59QL+L87DgiDnJHdjWp0d85jli4tAONj3qg1jh1AksYFtvt3z/56c+vXxZvXr1lP9H7MnnBNgtgQVsZZ7Xb5dT2h/qOVZqzh/wnn3yrwMbL7AlgQU8xtUDN2n/euzPJHyEjw4YheMnsICtLc8XvPhOZG3iau9OcN8D16c+AXAKnOQOPNpyOvrV/xw+utkEf/uce4weebr8LohOOBECCzgK07R6t+eno3/e7BU7hAdfAz/OLULgWFzv+eGdl+IKTofAAo7CA/eF7covy/iAEyGwgKOxRMz5lsdIPLVffGsQTo/AAo7KPK8/LStZv+7B7yWu4ETZ5A4crWlaXS+Heu7i4c/iCk6YwAKO2jStzjbHRjzjNww/Lxva7bmCEyawgJMwTauLJbSe8pmFbzYrZr4tCAgs4KQsD4a+jle03m9+plUr4A8CCzhJy63D62VD/M+PmIPNrcDNg69vlo31AP8lsICTt8TW+b3Xy2VO/ljler/8uQmpzSrVO6tVwLcILACAmHOwAABiAgsAICawAABiAgsAICawAABiAgsAICawAABiAgsAICawAABiAgsAICawAABiAgsAICawAABiAgsAICawAABiAgsAICawAABiAgsAICawAABiAgsAICawAABiAgsAICawAABiAgsAICawAABiAgsAICawAABiAgsAICawAABiAgsAICawAABiAgsAICawAABiAgsAICawAABiAgsAICawAABiAgsAICawAABiAgsAICawAABiAgsAICawAABiAgsAICawAABiAgsAICawAABiAgsAICawAABiAgsAICawAABiAgsAICawAABiAgsAICawAABiAgsAICawAABiAgsAICawAABiAgsAICawAABiAgsAICawAABiAgsAICawAABiAgsAICawAABiAgsAICawAABiAgsAICawAABiAgsAICawAABiAgsAICawAABiAgsAICawAABiAgsAICawAABiAgsAICawAABiAgsAICawAABiAgsAICawAABiAgsAICawAABiAgsAICawAABiAgsAICawAABiAgsAICawAABiAgsAICawAABiAgsAICawAABiAgsAICawAABiAgsAICawAABiAgsAICawAABiAgsAICawAABiAgsAICawAABiAgsAICawAABiAgsAICawAABiAgsAICawAABiAgsAICawAABiAgsAICawAABiAgsAICawAABiAgsAICawAABiAgsAICawAABiAgsAICawAABiAgsAICawAABiAgsAICawAABiAgsAICawAABiAgsAICawAABiAgsAICawAABiAgsAICawAABiAgsAICawAABiAgsAICawAABiAgsAICawAABiAgsAICawAABiAgsAICawAABiAgsAICawAABiAgsAICawAABiAgsAICawAABiAgsAICawAABiAgsAICawAABiAgsAICawAABiAgsAICawAABiAgsAICawAABiAgsAICawAABiAgsAICawAABiAgsAICawAABiAgsAICawAABiAgsAICawAABiAgsAICawAABiAgsAICawAABiAgsAICawAABiAgsAICawAABiAgsAICawAABiAgsAICawAABiAgsAICawAABiAgsAICawAABiAgsAICawAABiAgsAICawAABiAgsAICawAABiAgsAICawAABiAgsAICawAABiAgsAICawAABiAgsAICawAABiAgsAICawAABiAgsAICawAABiAgsAICawAABiAgsAICawAABiAgsAICawAABiAgsAICawAABiAgsAICawAABiAgsAICawAABiAgsAICawAABiAgsAICawAABiAgsAICawAABiAgsAICawAABiAgsAICawAABiAgsAICawAABiAgsAICawAABiAgsAICawAABiAgsAICawAABiAgsAICawAABiAgsAICawAABiAgsAICawAABiAgsAICawAABiAgsAICawAABiAgsAICawAABiAgsAICawAABiAgsAICawAABiAgsAICawAABiAgsAICawAABiAgsAICawAABiAgsAICawAABiAgsAICawAABiAgsAICawAABiAgsAICawAABiAgsAICawAABiAgsAICawAABiAgsAICawAABiAgsAICawAABiAgsAICawAABiAgsAICawAABiAgsAICawAABiAgsAICawAABiAgsAICawAABiAgsAICawAABiAgsAICawAABiAgsAICawAABiAgsAICawAABiAgsAICawAABiAgsAICawAABiAgsAICawAABiAgsAICawAABiAgsAICawAABiAgsAICawAABiAgsAICawAABiAgsAICawAABiAgsAICawAABiAgsAICawAABiAgsAoDTG+A9hPxOxxIYUjAAAAABJRU5ErkJggg==";

    const img$7 = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAlgAAAJYCAYAAAC+ZpjcAAAACXBIWXMAAAsSAAALEgHS3X78AAAOVklEQVR4nO3dwW0c5xmA4d+B73EqkDqwchpgL1YHUSowO7DSgVNBpApCVRC6gtCXBeYUqYJYHUgVMBhjmNAEqd1VXptc8nmAhQByl1zO6PDin3+/+eLi4mIAAND5nWMJANASWAAAMYEFABATWAAAMYEFABATWAAAMYEFABATWAAAMYEFABATWAAAMYEFABATWAAAMYEFABATWAAAMYEFABATWAAAMYEFABATWAAAMYEFABATWAAAMYEFABATWAAAMYEFABATWAAAMYEFABATWAAAMYEFABATWAAAMYEFABATWAAAMYEFABATWAAAMYEFABATWAAAMYEFABATWAAAMYEFABATWAAAMYEFABATWAAAMYEFABATWAAAMYEFABATWAAAMYEFABATWAAAMYEFABATWAAAMYEFABATWAAAMYEFABATWAAAMYEFABATWAAAMYEFABATWAAAMYEFABATWAAAMYEFABATWAAAMYEFABATWAAAMYEFABATWAAAMYEFABATWAAAMYEFABATWAAAMYEFABATWAAAMYEFABATWAAAMYEFABATWAAAMYEFABATWAAAMYEFABATWAAAMYEFABATWAAAMYEFABATWAAAMYEFABATWAAAMYEFABATWAAAMYEFABATWAAAMYEFABATWAAAMYEFABATWAAAMYEFABATWAAAMYEFABATWAAAMYEFABATWAAAMYEFABATWAAAMYEFABATWAAAMYEFABATWAAAMYEFABATWAAAMYEFABATWAAAMYEFABATWAAAMYEFABATWAAAMYEFABATWAAAMYEFABATWAAAMYEFABATWAAAMYEFABATWAAAMYEFABATWAAAMYEFABATWAAAMYEFABATWAAAMYEFABATWAAAMYEFABATWAAAMYEFABATWAAAMYEFABATWAAAMYEFABATWAAAMYEFABATWAAAMYEFABATWAAAMYEFABATWAAAMYEFABATWAAAMYEFABATWAAAMYEFABATWAAAMYEFABATWAAAMYEFABATWAAAMYEFABATWAAAMYEFABATWAAAMYEFABATWAAAMYEFABATWAAAMYEFABATWAAAMYEFABATWAAAMYEFABATWAAAMYEFABATWAAAMYEFABATWAAAMYEFABATWAAAMYEFABATWAAAMYEFABATWAAAMYEFABATWAAAMYEFABATWAAAMYEFABATWAAAMYEFABATWAAAMYEFABATWAAAMYEFABATWAAAMYEFABATWAAAMYEFABATWAAAMYEFABATWAAAMYEFABATWAAAMYEFABATWAAAMYEFABATWAAAMYEFABATWAAAMYEFABATWAAAMYEFABATWAAAMYEFABATWAAAMYEFABATWAAAMYEFABATWAAAMYEFABATWAAAMYEFABATWAAAMYEFABATWAAAMYEFABATWAAAMYEFABATWAAAMYEFABATWAAAMYEFABATWAAAMYEFABATWAAAMYEFABATWAAAMYEFABD70gEFOC7TtHk+xjgZYzwdY3wYY5yPMU7nefvBqYT74YuLiwunAuBITNPmdIzx7Q3v9v0Y48U8b986l3D3BBbAkZimzasxxnefeLdLZD2zkgV3zx4sgCMwTZunO+Jq8WSM8dL5hLsnsACOw4s93+WJ8wl3T2ABHIev9nyXT5xPuHsCCwAgJrAAjoON63BEBBbAcTjb813+4HzC3RNYAEdgnrc/7RlPr5xPuHsCC+B4LJ8QfPeJd/t6nrfnzifcPYEFcCTWAaLLbXJejzE+XnnXy4DRP8/z1gwsuCdMcgcAiFnBAgCICSwAgJjAAgCICSwAgJjAAgCICSwAgJjAAgCICSwAgJjAAgCICSwAgJjAAgCICSwAgJjAAgCICSwAgNiXDijw/5imzckYY3l8s/6YH8cYZ/O8feXAAo/VFxcXF04+cLBp2jwbY5yOMb6+5bXvlvCa5+1bRxd4bAQWcLBp2jwdYyzh9Psdr/04xng6z9sPjjLwmNiDBXyO0z3iaqzPcakQeHSsYAEHWS8N/uvAl/3BKhbwmFjBAg714jd6DcDR8ilC4FDPP+M1T+/zUV73lL0cYyyrc+fLZc1dK27rSt5lOJ7O8/anPX7P8pqvxhgfbP6Hh80lQuAg07Q5vzKSYV9/neft9/fxSE/TZgnGf1778rI5/9lt0TRNm2Vf2XfXvvxmjPH99desUXWyxtiTK99axlm8cOkUHiYrWMBjd3rD379szj9bV7R+YZ37dT2uFt8uj2navFlf+2J93PZhgG/WDwCcPPYTAA+RPVjAoXZeCrvB+X08yuvq0pNbvv31ulJ19fnLatffd/zYJbT+sf6765OW9qbBAyWwgEOdHfj89/O8vZeBtUfgfLdG1WWMHfq377LPqAvgCAks4CDzvD1bp7Tv6z7PwdpnBels3QS/7+yvQxxyHIEjIrCAz3GybgTf5c19vSfhGk233ebnqiWq/r3ncw/x0f4reLgEFnCwdcTA8x2RtcTVnQfE5SW+G9zV/qf36ycOnxnVAA+XMQ3AZ5umzVdXRhBc+mmdC/Wb77ta38/z9fHs2jiJ5XLc+TxvX67PXS51/in4tcvP/bBjdMX7df/WqaiCx0FgAUdr3Xh+GVPPP/GJwKverUNFr8+++hz/vZn1Or7hcsXum/X3LFF1Jqrg8RFYwNG58om+fYLq17LE1XPxBNzEoFHgqKyb08/vwYiDl+IKuI1N7sCxOfmV4+ovY4wfdjxnufXPTRPgAX4msAB+6WyNuPe3HJc39/W+isD9IbCAY/M5t+rZ17vlZs3rDZhf3DCG4sd1gzzAJ9nkDhydadq8/cTgz4/rHq3l8XZ9nO0Yo3Dp9eUYh/G/sQ9LaC37vt6uU+wBdhJYwNFZw+fVGj5jXdU6X+dc3bjCNU2bJZz+tuNv/aON60BBYAGPxjre4fSW1a/l8uAz/xuAgj1YwKNx5RY/r6/9ze/dFxAoWcECHqV1ntbPlxjv4rY+wMMmsAAAYi4RAgDEBBYAQExgAQDEBBYAQExgAQDEBBYAQExgAQDEBBYAQExgAQDEBBYAQExgAQDEBBYAQExgAQDEBBYAQExgAQDEBBYAQExgAQDEBBYAQExgAQDEBBYAQExgAQDEBBYAQExgAQDEBBYAQExgAQDEBBYAQExgAQDEBBYAQExgAQDEBBYAQExgAQDEBBYAQExgAQDEBBYAQExgAQDEBBYAQExgAQDEBBYAQExgAQDEBBYAQExgAQDEBBYAQExgAQDEBBYAQExgAQDEBBYAQExgAQDEBBYAQExgAQDEBBYAQExgAQDEBBYAQExgAQDEBBYAQExgAQDEBBYAQExgAQDEBBYAQExgAQDEBBYAQExgAQDEBBYAQExgAQDEBBYAQExgAQDEBBYAQExgAQDEBBYAQExgAQDEBBYAQExgAQDEBBYAQExgAQDEBBYAQExgAQDEBBYAQExgAQDEBBYAQExgAQDEBBYAQExgAQDEBBYAQExgAQDEBBYAQExgAQDEBBYAQExgAQDEBBYAQExgAQDEBBYAQExgAQDEBBYAQExgAQDEBBYAQExgAQDEBBYAQExgAQDEBBYAQExgAQDEBBYAQExgAQDEBBYAQExgAQDEBBYAQExgAQDEBBYAQExgAQDEBBYAQExgAQDEBBYAQExgAQDEBBYAQExgAQDEBBYAQExgAQDEBBYAQExgAQDEBBYAQExgAQDEBBYAQExgAQDEBBYAQExgAQDEBBYAQExgAQDEBBYAQExgAQDEBBYAQExgAQDEBBYAQExgAQDEBBYAQExgAQDEBBYAQExgAQDEBBYAQExgAQDEBBYAQExgAQDEBBYAQExgAQDEBBYAQExgAQDEBBYAQExgAQDEBBYAQExgAQDEBBYAQExgAQDEBBYAQExgAQDEBBYAQExgAQDEBBYAQExgAQDEBBYAQExgAQDEBBYAQExgAQDEBBYAQExgAQDEBBYAQExgAQDEBBYAQExgAQDEBBYAQExgAQDEBBYAQExgAQDEBBYAQExgAQDEBBYAQExgAQDEBBYAQExgAQDEBBYAQExgAQDEBBYAQExgAQDEBBYAQExgAQDEBBYAQExgAQDEBBYAQExgAQDEBBYAQExgAQDEBBYAQExgAQDEBBYAQExgAQDEBBYAQExgAQDEBBYAQExgAQDEBBYAQExgAQDEBBYAQExgAQDEBBYAQExgAQDEBBYAQExgAQDEBBYAQExgAQDEBBYAQExgAQDEBBYAQExgAQDEBBYAQExgAQDEBBYAQExgAQDEBBYAQExgAQDEBBYAQExgAQDEBBYAQExgAQDEBBYAQExgAQDEBBYAQExgAQDEBBYAQExgAQDEBBYAQExgAQDEBBYAQExgAQDEBBYAQExgAQDEBBYAQExgAQDEBBYAQExgAQDEBBYAQExgAQDEBBYAQExgAQDEBBYAQExgAQDEBBYAQExgAQDEBBYAQExgAQDEBBYAQExgAQDEBBYAQExgAQDEBBYAQExgAQDEBBYAQExgAQDEBBYAQExgAQDEBBYAQExgAQDEBBYAQExgAQDEBBYAQExgAQDEBBYAQExgAQDEBBYAQExgAQDEBBYAQExgAQDEBBYAQExgAQDEBBYAQExgAQDEBBYAQExgAQDEBBYAQExgAQDEBBYAQExgAQDEBBYAQExgAQDEBBYAQExgAQDEBBYAQExgAQDEBBYAQExgAQDEBBYAQExgAQDEBBYAQExgAQDEBBYAQExgAQDEBBYAQExgAQDEBBYAQExgAQDEBBYAQExgAQDEBBYAQExgAQDEBBYAQExgAQDEBBYAQExgAQDEBBYAQExgAQDEBBYAQExgAQDEBBYAQExgAQDEBBYAQExgAQDEBBYAQExgAQDEBBYAQGmM8R87yEEsUxA9BwAAAABJRU5ErkJggg==";

    /* src\components\menu\Alien.svelte generated by Svelte v3.21.0 */
    const file$c = "src\\components\\menu\\Alien.svelte";

    function create_fragment$c(ctx) {
    	let div;
    	let img0;
    	let img0_src_value;
    	let t;
    	let img1;
    	let img1_src_value;

    	const block = {
    		c: function create() {
    			div = element("div");
    			img0 = element("img");
    			t = space();
    			img1 = element("img");
    			attr_dev(img0, "class", "display alien-body svelte-mf3n5e");
    			if (img0.src !== (img0_src_value = /*body*/ ctx[0])) attr_dev(img0, "src", img0_src_value);
    			attr_dev(img0, "alt", "");
    			add_location(img0, file$c, 82, 2, 2103);
    			attr_dev(img1, "class", "display alien-face svelte-mf3n5e");
    			if (img1.src !== (img1_src_value = /*face*/ ctx[1])) attr_dev(img1, "src", img1_src_value);
    			attr_dev(img1, "alt", "");
    			add_location(img1, file$c, 83, 2, 2159);
    			attr_dev(div, "class", "Alien svelte-mf3n5e");
    			add_location(div, file$c, 81, 0, 2080);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, img0);
    			append_dev(div, t);
    			append_dev(div, img1);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*body*/ 1 && img0.src !== (img0_src_value = /*body*/ ctx[0])) {
    				attr_dev(img0, "src", img0_src_value);
    			}

    			if (dirty & /*face*/ 2 && img1.src !== (img1_src_value = /*face*/ ctx[1])) {
    				attr_dev(img1, "src", img1_src_value);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$c.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$c($$self, $$props, $$invalidate) {
    	let { state } = $$props;
    	let prevState;

    	const stateMap = {
    		default: { body: img, face: img$4 },
    		error: { body: img$1, face: img$5 },
    		hint: { body: img$1, face: img$6 },
    		success: { body: img$2, face: img$6 }
    	};

    	const writable_props = ["state"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Alien> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Alien", $$slots, []);

    	$$self.$set = $$props => {
    		if ("state" in $$props) $$invalidate(2, state = $$props.state);
    	};

    	$$self.$capture_state = () => ({
    		onMount,
    		beforeUpdate,
    		state,
    		bodyNeutral: img,
    		bodyPoint: img$1,
    		bodyExcited: img$2,
    		bodyConfused: img$3,
    		faceNeutral: img$4,
    		faceProblem: img$5,
    		faceExcited: img$6,
    		faceConfused: img$7,
    		prevState,
    		stateMap,
    		body,
    		face
    	});

    	$$self.$inject_state = $$props => {
    		if ("state" in $$props) $$invalidate(2, state = $$props.state);
    		if ("prevState" in $$props) prevState = $$props.prevState;
    		if ("body" in $$props) $$invalidate(0, body = $$props.body);
    		if ("face" in $$props) $$invalidate(1, face = $$props.face);
    	};

    	let body;
    	let face;

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*state*/ 4) {
    			 $$invalidate(0, body = stateMap[state]
    			? stateMap[state].body
    			: stateMap.default.body);
    		}

    		if ($$self.$$.dirty & /*state*/ 4) {
    			 $$invalidate(1, face = stateMap[state]
    			? stateMap[state].face
    			: stateMap.default.face);
    		}
    	};

    	return [body, face, state];
    }

    class Alien extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$c, create_fragment$c, safe_not_equal, { state: 2 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Alien",
    			options,
    			id: create_fragment$c.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*state*/ ctx[2] === undefined && !("state" in props)) {
    			console.warn("<Alien> was created without expected prop 'state'");
    		}
    	}

    	get state() {
    		throw new Error("<Alien>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set state(value) {
    		throw new Error("<Alien>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    const showMessages = writable(false);
    const lastCorrect = writable(null);
    const error = writable(null);
    const alienState = writable(null);

    /* src\App.svelte generated by Svelte v3.21.0 */

    const file$d = "src\\App.svelte";

    // (190:6) {#if true}
    function create_if_block_2$4(ctx) {
    	let current;
    	const history_1 = new History({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(history_1.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(history_1, target, anchor);
    			current = true;
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(history_1.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(history_1.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(history_1, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2$4.name,
    		type: "if",
    		source: "(190:6) {#if true}",
    		ctx
    	});

    	return block;
    }

    // (217:4) {#if $history.current}
    function create_if_block$9(ctx) {
    	let div;
    	let t;
    	let current;

    	const equation = new Equation$1({
    			props: {
    				error: /*$error*/ ctx[4],
    				equation: parseGrammar(/*$history*/ ctx[1].current)
    			},
    			$$inline: true
    		});

    	let if_block = /*$dragdropData*/ ctx[5].drop && create_if_block_1$6(ctx);

    	const block = {
    		c: function create() {
    			div = element("div");
    			create_component(equation.$$.fragment);
    			t = space();
    			if (if_block) if_block.c();
    			attr_dev(div, "class", "equation svelte-vqibtc");
    			toggle_class(div, "disable", /*$error*/ ctx[4]);
    			add_location(div, file$d, 217, 6, 5232);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			mount_component(equation, div, null);
    			append_dev(div, t);
    			if (if_block) if_block.m(div, null);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const equation_changes = {};
    			if (dirty & /*$error*/ 16) equation_changes.error = /*$error*/ ctx[4];
    			if (dirty & /*$history*/ 2) equation_changes.equation = parseGrammar(/*$history*/ ctx[1].current);
    			equation.$set(equation_changes);

    			if (/*$dragdropData*/ ctx[5].drop) {
    				if (if_block) {
    					if_block.p(ctx, dirty);

    					if (dirty & /*$dragdropData*/ 32) {
    						transition_in(if_block, 1);
    					}
    				} else {
    					if_block = create_if_block_1$6(ctx);
    					if_block.c();
    					transition_in(if_block, 1);
    					if_block.m(div, null);
    				}
    			} else if (if_block) {
    				group_outros();

    				transition_out(if_block, 1, 1, () => {
    					if_block = null;
    				});

    				check_outros();
    			}

    			if (dirty & /*$error*/ 16) {
    				toggle_class(div, "disable", /*$error*/ ctx[4]);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(equation.$$.fragment, local);
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(equation.$$.fragment, local);
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_component(equation);
    			if (if_block) if_block.d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$9.name,
    		type: "if",
    		source: "(217:4) {#if $history.current}",
    		ctx
    	});

    	return block;
    }

    // (220:8) {#if $dragdropData.drop}
    function create_if_block_1$6(ctx) {
    	let div;
    	let current;

    	const equation = new Equation$1({
    			props: {
    				equation: parseGrammar(/*$draftEquation*/ ctx[6])
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			div = element("div");
    			create_component(equation.$$.fragment);
    			attr_dev(div, "class", "draft-equation svelte-vqibtc");
    			add_location(div, file$d, 220, 10, 5402);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			mount_component(equation, div, null);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const equation_changes = {};
    			if (dirty & /*$draftEquation*/ 64) equation_changes.equation = parseGrammar(/*$draftEquation*/ ctx[6]);
    			equation.$set(equation_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(equation.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(equation.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_component(equation);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$6.name,
    		type: "if",
    		source: "(220:8) {#if $dragdropData.drop}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$d(ctx) {
    	let div7;
    	let div1;
    	let h1;
    	let t1;
    	let div0;
    	let t2;
    	let div3;
    	let svg;
    	let path0;
    	let path1;
    	let path2;
    	let t3;
    	let t4;
    	let div2;
    	let t5;
    	let div4;
    	let t6;
    	let t7;
    	let t8;
    	let t9;
    	let div5;
    	let t10;
    	let div6;
    	let t11;
    	let button;
    	let current;
    	let dispose;
    	let if_block0 =  create_if_block_2$4(ctx);

    	const alien = new Alien({
    			props: { state: /*$alienState*/ ctx[2] },
    			$$inline: true
    		});

    	const draggableoperator0 = new DraggableOperator({
    			props: { operator: new PlusOperator("", []) },
    			$$inline: true
    		});

    	const draggableoperator1 = new DraggableOperator({
    			props: { operator: new MinusOperator("", []) },
    			$$inline: true
    		});

    	const draggableoperator2 = new DraggableOperator({
    			props: { operator: new TimesOperator("", []) },
    			$$inline: true
    		});

    	const draggableoperator3 = new DraggableOperator({
    			props: {
    				onlySymbol: true,
    				operator: new DivideOperator("", [])
    			},
    			$$inline: true
    		});

    	let if_block1 = /*$history*/ ctx[1].current && create_if_block$9(ctx);

    	const buttons = new Buttons({
    			props: {
    				error: /*$error*/ ctx[4],
    				onUndo: /*onUndo*/ ctx[7]
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			div7 = element("div");
    			div1 = element("div");
    			h1 = element("h1");
    			h1.textContent = "Steps";
    			t1 = space();
    			div0 = element("div");
    			if (if_block0) if_block0.c();
    			t2 = space();
    			div3 = element("div");
    			svg = svg_element("svg");
    			path0 = svg_element("path");
    			path1 = svg_element("path");
    			path2 = svg_element("path");
    			t3 = space();
    			create_component(alien.$$.fragment);
    			t4 = space();
    			div2 = element("div");
    			t5 = space();
    			div4 = element("div");
    			create_component(draggableoperator0.$$.fragment);
    			t6 = space();
    			create_component(draggableoperator1.$$.fragment);
    			t7 = space();
    			create_component(draggableoperator2.$$.fragment);
    			t8 = space();
    			create_component(draggableoperator3.$$.fragment);
    			t9 = space();
    			div5 = element("div");
    			if (if_block1) if_block1.c();
    			t10 = space();
    			div6 = element("div");
    			create_component(buttons.$$.fragment);
    			t11 = space();
    			button = element("button");
    			button.textContent = "🕨";
    			attr_dev(h1, "class", "svelte-vqibtc");
    			add_location(h1, file$d, 187, 4, 4183);
    			attr_dev(div0, "class", "history svelte-vqibtc");
    			add_location(div0, file$d, 188, 4, 4203);
    			attr_dev(div1, "class", "steps svelte-vqibtc");
    			add_location(div1, file$d, 186, 2, 4158);
    			set_style(path0, "fill", "#FF6E52");
    			attr_dev(path0, "d", "M184.8,0H0v269h302V117.2C302,52.5,249.5,0,184.8,0z");
    			attr_dev(path0, "class", "svelte-vqibtc");
    			add_location(path0, file$d, 196, 6, 4405);
    			set_style(path1, "fill", "#FFC33E");
    			attr_dev(path1, "d", "M170.8,6H25v263h263V123.2C288,58.5,235.5,6,170.8,6z");
    			attr_dev(path1, "class", "svelte-vqibtc");
    			add_location(path1, file$d, 199, 6, 4516);
    			set_style(path2, "fill", "#f5f4f3");
    			attr_dev(path2, "d", "M152.8,0H0v269h270V117.2C270,52.5,217.5,0,152.8,0z");
    			attr_dev(path2, "class", "svelte-vqibtc");
    			add_location(path2, file$d, 202, 6, 4628);
    			attr_dev(svg, "viewBox", "0 0 302 269");
    			set_style(svg, "enable-background", "new 0 0 302 269");
    			attr_dev(svg, "class", "svelte-vqibtc");
    			add_location(svg, file$d, 195, 4, 4327);
    			attr_dev(div2, "id", "hintwindow");
    			attr_dev(div2, "class", "CTATHintWindow svelte-vqibtc");
    			toggle_class(div2, "visible", /*$showMessages*/ ctx[3]);
    			add_location(div2, file$d, 207, 4, 4784);
    			attr_dev(div3, "class", "alien svelte-vqibtc");
    			add_location(div3, file$d, 194, 2, 4302);
    			attr_dev(div4, "class", "operators svelte-vqibtc");
    			add_location(div4, file$d, 209, 2, 4874);
    			attr_dev(div5, "class", "main svelte-vqibtc");
    			add_location(div5, file$d, 215, 2, 5178);
    			attr_dev(button, "class", "mute svelte-vqibtc");
    			toggle_class(button, "muted", /*muted*/ ctx[0]);
    			add_location(button, file$d, 230, 4, 5638);
    			attr_dev(div6, "class", "buttons svelte-vqibtc");
    			add_location(div6, file$d, 227, 2, 5568);
    			attr_dev(div7, "class", "app svelte-vqibtc");
    			add_location(div7, file$d, 185, 0, 4137);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor, remount) {
    			insert_dev(target, div7, anchor);
    			append_dev(div7, div1);
    			append_dev(div1, h1);
    			append_dev(div1, t1);
    			append_dev(div1, div0);
    			if (if_block0) if_block0.m(div0, null);
    			append_dev(div7, t2);
    			append_dev(div7, div3);
    			append_dev(div3, svg);
    			append_dev(svg, path0);
    			append_dev(svg, path1);
    			append_dev(svg, path2);
    			append_dev(div3, t3);
    			mount_component(alien, div3, null);
    			append_dev(div3, t4);
    			append_dev(div3, div2);
    			append_dev(div7, t5);
    			append_dev(div7, div4);
    			mount_component(draggableoperator0, div4, null);
    			append_dev(div4, t6);
    			mount_component(draggableoperator1, div4, null);
    			append_dev(div4, t7);
    			mount_component(draggableoperator2, div4, null);
    			append_dev(div4, t8);
    			mount_component(draggableoperator3, div4, null);
    			append_dev(div7, t9);
    			append_dev(div7, div5);
    			if (if_block1) if_block1.m(div5, null);
    			append_dev(div7, t10);
    			append_dev(div7, div6);
    			mount_component(buttons, div6, null);
    			append_dev(div6, t11);
    			append_dev(div6, button);
    			current = true;
    			if (remount) dispose();
    			dispose = listen_dev(button, "click", /*click_handler*/ ctx[9], false, false, false);
    		},
    		p: function update(ctx, [dirty]) {
    			const alien_changes = {};
    			if (dirty & /*$alienState*/ 4) alien_changes.state = /*$alienState*/ ctx[2];
    			alien.$set(alien_changes);

    			if (dirty & /*$showMessages*/ 8) {
    				toggle_class(div2, "visible", /*$showMessages*/ ctx[3]);
    			}

    			if (/*$history*/ ctx[1].current) {
    				if (if_block1) {
    					if_block1.p(ctx, dirty);

    					if (dirty & /*$history*/ 2) {
    						transition_in(if_block1, 1);
    					}
    				} else {
    					if_block1 = create_if_block$9(ctx);
    					if_block1.c();
    					transition_in(if_block1, 1);
    					if_block1.m(div5, null);
    				}
    			} else if (if_block1) {
    				group_outros();

    				transition_out(if_block1, 1, 1, () => {
    					if_block1 = null;
    				});

    				check_outros();
    			}

    			const buttons_changes = {};
    			if (dirty & /*$error*/ 16) buttons_changes.error = /*$error*/ ctx[4];
    			buttons.$set(buttons_changes);

    			if (dirty & /*muted*/ 1) {
    				toggle_class(button, "muted", /*muted*/ ctx[0]);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block0);
    			transition_in(alien.$$.fragment, local);
    			transition_in(draggableoperator0.$$.fragment, local);
    			transition_in(draggableoperator1.$$.fragment, local);
    			transition_in(draggableoperator2.$$.fragment, local);
    			transition_in(draggableoperator3.$$.fragment, local);
    			transition_in(if_block1);
    			transition_in(buttons.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block0);
    			transition_out(alien.$$.fragment, local);
    			transition_out(draggableoperator0.$$.fragment, local);
    			transition_out(draggableoperator1.$$.fragment, local);
    			transition_out(draggableoperator2.$$.fragment, local);
    			transition_out(draggableoperator3.$$.fragment, local);
    			transition_out(if_block1);
    			transition_out(buttons.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div7);
    			if (if_block0) if_block0.d();
    			destroy_component(alien);
    			destroy_component(draggableoperator0);
    			destroy_component(draggableoperator1);
    			destroy_component(draggableoperator2);
    			destroy_component(draggableoperator3);
    			if (if_block1) if_block1.d();
    			destroy_component(buttons);
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$d.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$d($$self, $$props, $$invalidate) {
    	let $lastCorrect;
    	let $history;
    	let $alienState;
    	let $showMessages;
    	let $error;
    	let $dragdropData;
    	let $draftEquation;
    	validate_store(lastCorrect, "lastCorrect");
    	component_subscribe($$self, lastCorrect, $$value => $$invalidate(8, $lastCorrect = $$value));
    	validate_store(history, "history");
    	component_subscribe($$self, history, $$value => $$invalidate(1, $history = $$value));
    	validate_store(alienState, "alienState");
    	component_subscribe($$self, alienState, $$value => $$invalidate(2, $alienState = $$value));
    	validate_store(showMessages, "showMessages");
    	component_subscribe($$self, showMessages, $$value => $$invalidate(3, $showMessages = $$value));
    	validate_store(error, "error");
    	component_subscribe($$self, error, $$value => $$invalidate(4, $error = $$value));
    	validate_store(dragdropData, "dragdropData");
    	component_subscribe($$self, dragdropData, $$value => $$invalidate(5, $dragdropData = $$value));
    	validate_store(draftEquation, "draftEquation");
    	component_subscribe($$self, draftEquation, $$value => $$invalidate(6, $draftEquation = $$value));
    	let muted = false;

    	function onUndo() {
    		history.undo();

    		if ($lastCorrect === $history.current) {
    			error.set(null);
    		}
    	}

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("App", $$slots, []);

    	const click_handler = () => {
    		soundEffects.mute(!soundEffects._muted);
    		$$invalidate(0, muted = !muted);
    	};

    	$$self.$capture_state = () => ({
    		parseGrammar,
    		draftEquation,
    		dragdropData,
    		history,
    		soundEffects,
    		Equation: Equation$1,
    		DraggableOperator,
    		History,
    		Buttons,
    		Alien,
    		muted,
    		PlusOperator,
    		MinusOperator,
    		TimesOperator,
    		DivideOperator,
    		showMessages,
    		lastCorrect,
    		error,
    		alienState,
    		onUndo,
    		$lastCorrect,
    		$history,
    		$alienState,
    		$showMessages,
    		$error,
    		$dragdropData,
    		$draftEquation
    	});

    	$$self.$inject_state = $$props => {
    		if ("muted" in $$props) $$invalidate(0, muted = $$props.muted);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		muted,
    		$history,
    		$alienState,
    		$showMessages,
    		$error,
    		$dragdropData,
    		$draftEquation,
    		onUndo,
    		$lastCorrect,
    		click_handler
    	];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$d, create_fragment$d, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment$d.name
    		});
    	}
    }

    /**
     * The following functions handle messages recieved from the CTATCommShell located in ctatloader.js
     * Documentation for these events are located here: https://github.com/CMUCTAT/CTAT/wiki/API#events
     *
     * The one event that won't be on there is onSuccess(), which is called by an eventlistener on the
     * CTATCommShell whenever the student has completed a problem
     */

    function onSuccess(finish, delay = 500) {
      alienState.set("success");
      showMessages.set(false);
      soundEffects.play("haHa");
      setTimeout(() => {
        finish();
      }, delay);
    }

    function handleCorrectAction(evt, msg) {
      showMessages.set(false);
      error.set(null);
      lastCorrect.set(get_store_value(history).current);
      alienState.set(null);
    }

    function handleInCorrectAction(evt, msg) {
      var sai = msg.getSAI();
      if (sai.getSelection() != "done") {
        showMessages.set(true);
        error.set(sai.getSelection());
        alienState.set("error");
        soundEffects.play("hmm");
      }
    }

    function handleBuggyMessage(evt, msg) {
      showMessages.set(true);
    }

    function handleSuccessMessage(evt, msg) {
      alienState.set("success");
      soundEffects.play("haHa");
    }

    function handleInterfaceAction(evt, msg) {
      if (!msg || typeof msg === "string" || msg instanceof String) return;
      var sai = msg.getSAI();
      var input = sai.getInput();
      console.log("INPUT:", input);
      if (input) {
        let parsedInput = parse.algParse(input);
        history.push(parsedInput);
        lastCorrect.set(parsedInput);
        // draftEquation.set(parse.algParse(input))
        // draftEquation.apply()
      }
    }

    function handleShowHintsMessage(evt, msg) {
      showMessages.set(true);
      alienState.set("hint");
    }

    /**-----------------------------------------------------------------------------
     $Author: sewall $
     $Date: 2016-12-15 12:33:36 -0500 (Thu, 15 Dec 2016) $
     $HeadURL: svn://pact-cvs.pact.cs.cmu.edu/usr5/local/svnroot/AuthoringTools/trunk/HTML5/ctatloader.js $
     $Revision: 24444 $

     -
     License:
     -
     ChangeLog:
     -
     Notes:

     */
    console.log("Starting ctatloader ...");
    if (frameElement && typeof frameElement.getAttribute == "function") {
      let dpAttr = frameElement.getAttribute("data-params");
      let dpObj = null;
      if (dpAttr && (dpObj = JSON.parse(dpAttr)) && dpObj.hasOwnProperty("CTATTarget")) {
        var CTATTarget = dpObj["CTATTarget"];
      }
    }

    // Set CTATTarget to Default if not already set.
    if (typeof CTATTarget == "undefined" || !CTATTarget) {
      console.log("CTATTarget not defined, setting it to 'Default' ...");
      var CTATTarget = "Default";
    } else {
      console.log("CTATTarget already defined at top of ctatloader, set to: " + CTATTarget);
    }

    console.log("Double checking target: " + CTATTarget);

    function startCTAT() {
      initTutor();

      // Once all the CTAT code has been loaded allow developers to activate custom code

      if (window.hasOwnProperty("ctatOnload")) {
        window["ctatOnload"]();
      } else {
        console.log("Warning: window.ctatOnload is not available");
      }
    }
    /**
     *
     */
    function initOnload() {
      console.log("initOnload ()");

      //>-------------------------------------------------------------------------

      if (CTATLMS.is.Authoring() || CTATTarget === "AUTHORING") {
        console.log('(CTATTarget=="AUTHORING")');

        var session =  CTATConfiguration.get("session_id");
        var port =  CTATConfiguration.get("remoteSocketPort");
        if (window.location.search) {
          var p = /[?&;]port=(\d+)/i.exec(window.location.search);
          if (p && p.length >= 2) {
            port = decodeURIComponent(p[1].replace(/\+/g, " "));
          }
          var s = /[?&;]session=([^&]*)/i.exec(window.location.search);
          if (s && s.length >= 2) {
            session = decodeURIComponent(s[1].replace(/\+/g, " "));
          }
        }
        CTATConfiguration.set("tutoring_service_communication", "websocket");
        CTATConfiguration.set("user_guid", "author");
        CTATConfiguration.set("question_file", "");
        CTATConfiguration.set("session_id", session);
        CTATConfiguration.set("remoteSocketPort", port);
        CTATConfiguration.set("remoteSocketURL", "127.0.0.1");

        startCTAT();
        return;
      }

      //>-------------------------------------------------------------------------

      if (CTATLMS.is.OLI()) {
        // Do nothing as OLI will call initTutor and ctatOnload.
        // Should probably move to a similar mechanism as XBlock
        console.log("CTATTarget=='OLI'");
        return;
      }

      //>-------------------------------------------------------------------------

      if (CTATLMS.is.SCORM()) {
        console.log("CTATTarget=='SCORM'");

        CTATLMS.init.SCORM();
        // Initialize our own code ...
        startCTAT();
        return;
      }

      //>-------------------------------------------------------------------------

      // if (CTATLMS.is.Assistments()) {
      // 	console.log("CTATTarget=='ASSISTMENTS'");

      // 	iframeLoaded(); // Assistments specific call

      // 	// Initialize our own code ...
      // 	startCTAT();
      // 	return;
      // }

      //>-------------------------------------------------------------------------

      if (CTATLMS.is.XBlock()) {
        console.log("CTATTarget=='XBlock'");

        CTATLMS.init.XBlock();
        // listen for configuration block
        window.addEventListener("message", function (event) {
          console.log("recieved message", event.origin, document.referrer, event.data);
          if (!document.referrer && event.origin !== new URl(document.referrer).origin) {
            console.log("Message not from valid source:", event.origin, "Expected:", document.referrer); // TODO: remove expected
            return;
          }
          if (!CTATTutor.tutorInitialized && "question_file" in event.data) {
            // looks like we have configuration
            initTutor(event.data);
            if (window.hasOwnProperty("ctatOnload")) {
              window["ctatOnload"]();
            }
          }
          // Should probably remove listener once configuration is received
          // so that malicious hackers do not cause multiple initializations.
        });
        return;
      }

      //>-------------------------------------------------------------------------

      /*
       * The target CTAT is synonymous with TutorShop. You can use this target outside of
       * TutorShop if you use the same directory structure for the css, js and brd files
       */
      if (CTATTarget == "CTAT" || CTATTarget == "LTI" || CTATLMS.is.TutorShop()) {
        console.log("CTATTarget=='CTAT'");

        CTATLMS.init.TutorShop();
        startCTAT();

        return;
      }

      //>-------------------------------------------------------------------------

      /*
       * This target is available to you if you would like to either develop your own
       * Learner Management System or would like to test and run your tutor standalone.
       * NOTE! This version will NOT call initTutor since that is the responsibility
       * of the author in this case.
       */
      if (CTATTarget == "Default") {
        console.log("CTATTarget=='Default'");

        // Once all the CTAT code has been loaded allow developers to activate custom code

        if (window.hasOwnProperty("ctatOnload")) {
          window["ctatOnload"]();
        } else {
          console.log("Warning: window.ctatOnload is not available, running initTutor()");
          initTutor();
        }

        return;
      }

      //>-------------------------------------------------------------------------
    }
    /**
     *
     */
    if (window.jQuery) {
      $(function () {
        CTATScrim.scrim.waitScrimUp();
        console.log("$(window).load(" + CTATTarget + ")");
        initOnload();
        CTATCommShell.commShell.assignDoneProcessor((input, finish) => {
          onSuccess(finish);
        });
        CTATCommShell.commShell.addGlobalEventListener({
          processCommShellEvent: (evt, msg) => {
            // console.log(evt, msg);
            switch (evt) {
              case "BuggyMessage":
                handleBuggyMessage();
                break;
              case "InterfaceAction":
                handleInterfaceAction(evt, msg);
                break;
              case "CorrectAction":
                handleCorrectAction();
                break;
              case "InCorrectAction":
                handleInCorrectAction(evt, msg);
                break;
              case "BuggyMessage":
                handleBuggyMessage();
                break;
              case "ShowHintsMessage":
                handleShowHintsMessage();
                break;
              case "SuccessMessage":
                handleSuccessMessage();
                break;
            }
          },
        });
      });
    } else {
      console.log("Error: JQuery not available, can not execute $(window).on('load',...)");
    }

    window.drag = {};
    window.drop = {};
    var app = new App({
    	target: document.body
    });

    return app;

}());
//# sourceMappingURL=bundle.js.map
