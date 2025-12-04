import * as rbush from 'rbush';

/**
 * {@link module :ol/tilegrid/TileGrid~TileGrid#getZForResolution} can use a function
 * of this type to determine which nearest resolution to use.
 *
 * This function takes a `{number}` representing a value between two array entries,
 * a `{number}` representing the value of the nearest higher entry and
 * a `{number}` representing the value of the nearest lower entry
 * as arguments and returns a `{number}`. If a negative number or zero is returned
 * the lower value will be used, if a positive number is returned the higher value
 * will be used.
 */
type NearestDirectionFunction = (arg0: number, arg1: number, arg2: number) => number;

/**
 * An array of numbers representing a size: `[width, height]`.
 */
type Size = Array<number>;

/**
 * @typedef {Object} Entry
 * @property {string} key_ Key.
 * @property {Entry|null} newer Newer.
 * @property {Entry|null} older Older.
 * @property {*} value_ Value.
 */
/**
 * @classdesc
 * Implements a Least-Recently-Used cache where the keys do not conflict with
 * Object's properties (e.g. 'hasOwnProperty' is not allowed as a key). Expiring
 * items from the cache is the responsibility of the user.
 *
 * @fires import("../events/Event.js").default
 * @template T
 */
declare class LRUCache<T> {
    /**
     * @param {number} [highWaterMark] High water mark.
     */
    constructor(highWaterMark?: number);
    /**
     * Desired max cache size after expireCache(). If set to 0, no cache entries
     * will be pruned at all.
     * @type {number}
     */
    highWaterMark: number;
    /**
     * @private
     * @type {number}
     */
    private count_;
    /**
     * @private
     * @type {!Object<string, Entry>}
     */
    private entries_;
    /**
     * @private
     * @type {?Entry}
     */
    private oldest_;
    /**
     * @private
     * @type {?Entry}
     */
    private newest_;
    deleteOldest(): void;
    /**
     * @return {boolean} Can expire cache.
     */
    canExpireCache(): boolean;
    /**
     * Expire the cache. When the cache entry is a {@link module:ol/Disposable~Disposable},
     * the entry will be disposed.
     * @param {!Object<string, boolean>} [keep] Keys to keep. To be implemented by subclasses.
     */
    expireCache(keep?: {
        [x: string]: boolean;
    }): void;
    /**
     * FIXME empty description for jsdoc
     */
    clear(): void;
    /**
     * @param {string} key Key.
     * @return {boolean} Contains key.
     */
    containsKey(key: string): boolean;
    /**
     * @param {function(T, string, LRUCache<T>): ?} f The function
     *     to call for every entry from the oldest to the newer. This function takes
     *     3 arguments (the entry value, the entry key and the LRUCache object).
     *     The return value is ignored.
     */
    forEach(f: (arg0: T, arg1: string, arg2: LRUCache<T>) => unknown): void;
    /**
     * @param {string} key Key.
     * @param {*} [options] Options (reserved for subclasses).
     * @return {T} Value.
     */
    get(key: string, options?: any): T;
    /**
     * Remove an entry from the cache.
     * @param {string} key The entry key.
     * @return {T} The removed entry.
     */
    remove(key: string): T;
    /**
     * @return {number} Count.
     */
    getCount(): number;
    /**
     * @return {Array<string>} Keys.
     */
    getKeys(): Array<string>;
    /**
     * @return {Array<T>} Values.
     */
    getValues(): Array<T>;
    /**
     * @return {T} Last value.
     */
    peekLast(): T;
    /**
     * @return {string} Last key.
     */
    peekLastKey(): string;
    /**
     * Get the key of the newest item in the cache.  Throws if the cache is empty.
     * @return {string} The newest key.
     */
    peekFirstKey(): string;
    /**
     * Return an entry without updating least recently used time.
     * @param {string} key Key.
     * @return {T|undefined} Value.
     */
    peek(key: string): T | undefined;
    /**
     * @return {T} value Value.
     */
    pop(): T;
    /**
     * @param {string} key Key.
     * @param {T} value Value.
     */
    replace(key: string, value: T): void;
    /**
     * @param {string} key Key.
     * @param {T} value Value.
     */
    set(key: string, value: T): void;
    /**
     * Set a maximum number of entries for the cache.
     * @param {number} size Cache size.
     * @api
     */
    setSize(size: number): void;
}

/**
 * @module ol/events/Event
 */
/**
 * @classdesc
 * Stripped down implementation of the W3C DOM Level 2 Event interface.
 * See https://www.w3.org/TR/DOM-Level-2-Events/events.html#Events-interface.
 *
 * This implementation only provides `type` and `target` properties, and
 * `stopPropagation` and `preventDefault` methods. It is meant as base class
 * for higher level events defined in the library, and works with
 * {@link module:ol/events/Target~Target}.
 */
declare class BaseEvent {
    /**
     * @param {string} type Type.
     */
    constructor(type: string);
    /**
     * @type {boolean}
     */
    propagationStopped: boolean;
    /**
     * @type {boolean}
     */
    defaultPrevented: boolean;
    /**
     * The event type.
     * @type {string}
     * @api
     */
    type: string;
    /**
     * The event target.
     * @type {Object}
     * @api
     */
    target: any;
    /**
     * Prevent default. This means that no emulated `click`, `singleclick` or `doubleclick` events
     * will be fired.
     * @api
     */
    preventDefault(): void;
    /**
     * Stop event propagation.
     * @api
     */
    stopPropagation(): void;
}

/**
 * @module ol/Disposable
 */
/**
 * @classdesc
 * Objects that need to clean up after themselves.
 */
declare class Disposable {
    /**
     * The object has already been disposed.
     * @type {boolean}
     * @protected
     */
    protected disposed: boolean;
    /**
     * Clean up.
     */
    dispose(): void;
    /**
     * Extension point for disposable objects.
     * @protected
     */
    protected disposeInternal(): void;
}
//# sourceMappingURL=Disposable.d.ts.map

type EventTargetLike = EventTarget | Target;
/**
 * @typedef {EventTarget|Target} EventTargetLike
 */
/**
 * @classdesc
 * A simplified implementation of the W3C DOM Level 2 EventTarget interface.
 * See https://www.w3.org/TR/2000/REC-DOM-Level-2-Events-20001113/events.html#Events-EventTarget.
 *
 * There are two important simplifications compared to the specification:
 *
 * 1. The handling of `useCapture` in `addEventListener` and
 *    `removeEventListener`. There is no real capture model.
 * 2. The handling of `stopPropagation` and `preventDefault` on `dispatchEvent`.
 *    There is no event target hierarchy. When a listener calls
 *    `stopPropagation` or `preventDefault` on an event object, it means that no
 *    more listeners after this one will be called. Same as when the listener
 *    returns false.
 */
declare class Target extends Disposable {
    /**
     * @param {*} [target] Default event target for dispatched events.
     */
    constructor(target?: any);
    /**
     * @private
     * @type {*}
     */
    private eventTarget_;
    /**
     * @private
     * @type {Object<string, number>|null}
     */
    private pendingRemovals_;
    /**
     * @private
     * @type {Object<string, number>|null}
     */
    private dispatching_;
    /**
     * @private
     * @type {Object<string, Array<import("../events.js").Listener>>|null}
     */
    private listeners_;
    /**
     * @param {string} type Type.
     * @param {import("../events.js").Listener} listener Listener.
     */
    addEventListener(type: string, listener: Listener): void;
    /**
     * Dispatches an event and calls all listeners listening for events
     * of this type. The event parameter can either be a string or an
     * Object with a `type` property.
     *
     * @param {import("./Event.js").default|string} event Event object.
     * @return {boolean|undefined} `false` if anyone called preventDefault on the
     *     event object or if any of the listeners returned false.
     * @api
     */
    dispatchEvent(event: BaseEvent | string): boolean | undefined;
    /**
     * Get the listeners for a specified event type. Listeners are returned in the
     * order that they will be called in.
     *
     * @param {string} type Type.
     * @return {Array<import("../events.js").Listener>|undefined} Listeners.
     */
    getListeners(type: string): Array<Listener> | undefined;
    /**
     * @param {string} [type] Type. If not provided,
     *     `true` will be returned if this event target has any listeners.
     * @return {boolean} Has listeners.
     */
    hasListener(type?: string): boolean;
    /**
     * @param {string} type Type.
     * @param {import("../events.js").Listener} listener Listener.
     */
    removeEventListener(type: string, listener: Listener): void;
}

/**
 * Key to use with {@link module :ol/Observable.unByKey}.
 */
type EventsKey = {
    /**
     * Listener.
     */
    listener: ListenerFunction;
    /**
     * Target.
     */
    target: EventTargetLike;
    /**
     * Type.
     */
    type: string;
};
/**
 * Listener function. This function is called with an event object as argument.
 * When the function returns `false`, event propagation will stop.
 */
type ListenerFunction = (arg0: (Event | BaseEvent)) => (void | boolean);
type ListenerObject = {
    /**
     * HandleEvent listener function.
     */
    handleEvent: ListenerFunction;
};
type Listener = ListenerFunction | ListenerObject;

type Types$2 = "propertychange";

/**
 * *
 */
type OnSignature<Type extends string, EventClass extends Event | BaseEvent, Return> = (type: Type, listener: (event: EventClass) => unknown) => Return;
/**
 * *
 */
type CombinedOnSignature<Type extends string, Return> = (type: Type[], listener: (event: Event | BaseEvent) => unknown) => Return extends void ? void : Return[];
type EventTypes = "change" | "error";
/**
 * *
 */
type ObservableOnSignature<Return> = OnSignature<EventTypes, BaseEvent, Return> & CombinedOnSignature<EventTypes, Return>;
/***
 * @template {string} Type
 * @template {Event|import("./events/Event.js").default} EventClass
 * @template Return
 * @typedef {(type: Type, listener: (event: EventClass) => ?) => Return} OnSignature
 */
/***
 * @template {string} Type
 * @template Return
 * @typedef {(type: Type[], listener: (event: Event|import("./events/Event").default) => ?) => Return extends void ? void : Return[]} CombinedOnSignature
 */
/**
 * @typedef {'change'|'error'} EventTypes
 */
/***
 * @template Return
 * @typedef {OnSignature<EventTypes, import("./events/Event.js").default, Return> & CombinedOnSignature<EventTypes, Return>} ObservableOnSignature
 */
/**
 * @classdesc
 * Abstract base class; normally only used for creating subclasses and not
 * instantiated in apps.
 * An event target providing convenient methods for listener registration
 * and unregistration. A generic `change` event is always available through
 * {@link module:ol/Observable~Observable#changed}.
 *
 * @fires import("./events/Event.js").default
 * @api
 */
declare class Observable extends Target {
    constructor();
    on: ObservableOnSignature<EventsKey>;
    once: ObservableOnSignature<EventsKey>;
    un: ObservableOnSignature<void>;
    /**
     * @private
     * @type {number}
     */
    private revision_;
    /**
     * Increases the revision counter and dispatches a 'change' event.
     * @api
     */
    changed(): void;
    /**
     * Get the version number for this object.  Each time the object is modified,
     * its version number will be incremented.
     * @return {number} Revision.
     * @api
     */
    getRevision(): number;
    /**
     * @param {string|Array<string>} type Type.
     * @param {function((Event|import("./events/Event").default)): ?} listener Listener.
     * @return {import("./events.js").EventsKey|Array<import("./events.js").EventsKey>} Event key.
     * @protected
     */
    protected onInternal(type: string | Array<string>, listener: (arg0: (Event | BaseEvent)) => unknown): EventsKey | Array<EventsKey>;
    /**
     * @param {string|Array<string>} type Type.
     * @param {function((Event|import("./events/Event").default)): ?} listener Listener.
     * @return {import("./events.js").EventsKey|Array<import("./events.js").EventsKey>} Event key.
     * @protected
     */
    protected onceInternal(type: string | Array<string>, listener: (arg0: (Event | BaseEvent)) => unknown): EventsKey | Array<EventsKey>;
    /**
     * Unlisten for a certain type of event.
     * @param {string|Array<string>} type Type.
     * @param {function((Event|import("./events/Event").default)): ?} listener Listener.
     * @protected
     */
    protected unInternal(type: string | Array<string>, listener: (arg0: (Event | BaseEvent)) => unknown): void;
}

/**
 * @classdesc
 * Events emitted by {@link module:ol/Object~BaseObject} instances are instances of this type.
 */
declare class ObjectEvent extends BaseEvent {
    /**
     * @param {string} type The event type.
     * @param {string} key The property name.
     * @param {*} oldValue The old value for `key`.
     */
    constructor(type: string, key: string, oldValue: any);
    /**
     * The name of the property whose value is changing.
     * @type {string}
     * @api
     */
    key: string;
    /**
     * The old value. To get the new value use `e.target.get(e.key)` where
     * `e` is the event object.
     * @type {*}
     * @api
     */
    oldValue: any;
}

/**
 * *
 */
type ObjectOnSignature<Return> = OnSignature<EventTypes, BaseEvent, Return> & OnSignature<Types$2, ObjectEvent, Return> & CombinedOnSignature<EventTypes | Types$2, Return>;

/***
 * @template Return
 * @typedef {import("./Observable").OnSignature<import("./Observable").EventTypes, import("./events/Event.js").default, Return> &
 *    import("./Observable").OnSignature<import("./ObjectEventType").Types, ObjectEvent, Return> &
 *    import("./Observable").CombinedOnSignature<import("./Observable").EventTypes|import("./ObjectEventType").Types, Return>} ObjectOnSignature
 */
/**
 * @classdesc
 * Abstract base class; normally only used for creating subclasses and not
 * instantiated in apps.
 * Most non-trivial classes inherit from this.
 *
 * This extends {@link module:ol/Observable~Observable} with observable
 * properties, where each property is observable as well as the object as a
 * whole.
 *
 * Classes that inherit from this have pre-defined properties, to which you can
 * add your owns. The pre-defined properties are listed in this documentation as
 * 'Observable Properties', and have their own accessors; for example,
 * {@link module:ol/Map~Map} has a `target` property, accessed with
 * `getTarget()` and changed with `setTarget()`. Not all properties are however
 * settable. There are also general-purpose accessors `get()` and `set()`. For
 * example, `get('target')` is equivalent to `getTarget()`.
 *
 * The `set` accessors trigger a change event, and you can monitor this by
 * registering a listener. For example, {@link module:ol/View~View} has a
 * `center` property, so `view.on('change:center', function(evt) {...});` would
 * call the function whenever the value of the center property changes. Within
 * the function, `evt.target` would be the view, so `evt.target.getCenter()`
 * would return the new center.
 *
 * You can add your own observable properties with
 * `object.set('prop', 'value')`, and retrieve that with `object.get('prop')`.
 * You can listen for changes on that property value with
 * `object.on('change:prop', listener)`. You can get a list of all
 * properties with {@link module:ol/Object~BaseObject#getProperties}.
 *
 * Note that the observable properties are separate from standard JS properties.
 * You can, for example, give your map object a title with
 * `map.title='New title'` and with `map.set('title', 'Another title')`. The
 * first will be a `hasOwnProperty`; the second will appear in
 * `getProperties()`. Only the second is observable.
 *
 * Properties can be deleted by using the unset method. E.g.
 * object.unset('foo').
 *
 * @fires ObjectEvent
 * @api
 */
declare class BaseObject extends Observable {
    /**
     * @param {Object<string, *>} [values] An object with key-value pairs.
     */
    constructor(values?: {
        [x: string]: any;
    });
    /***
     * @type {ObjectOnSignature<import("./events").EventsKey>}
     */
    on: ObjectOnSignature<EventsKey>;
    /***
     * @type {ObjectOnSignature<import("./events").EventsKey>}
     */
    once: ObjectOnSignature<EventsKey>;
    /***
     * @type {ObjectOnSignature<void>}
     */
    un: ObjectOnSignature<void>;
    /**
     * @private
     * @type {Object<string, *>|null}
     */
    private values_;
    /**
     * Gets a value.
     * @param {string} key Key name.
     * @return {*} Value.
     * @api
     */
    get(key: string): any;
    /**
     * Get a list of object property names.
     * @return {Array<string>} List of property names.
     * @api
     */
    getKeys(): Array<string>;
    /**
     * Get an object of all property names and values.
     * @return {Object<string, *>} Object.
     * @api
     */
    getProperties(): {
        [x: string]: any;
    };
    /**
     * Get an object of all property names and values.
     * @return {Object<string, *>?} Object.
     */
    getPropertiesInternal(): {
        [x: string]: any;
    } | null;
    /**
     * @return {boolean} The object has properties.
     */
    hasProperties(): boolean;
    /**
     * @param {string} key Key name.
     * @param {*} oldValue Old value.
     */
    notify(key: string, oldValue: any): void;
    /**
     * @param {string} key Key name.
     * @param {import("./events.js").Listener} listener Listener.
     */
    addChangeListener(key: string, listener: Listener): void;
    /**
     * @param {string} key Key name.
     * @param {import("./events.js").Listener} listener Listener.
     */
    removeChangeListener(key: string, listener: Listener): void;
    /**
     * Sets a value.
     * @param {string} key Key name.
     * @param {*} value Value.
     * @param {boolean} [silent] Update without triggering an event.
     * @api
     */
    set(key: string, value: any, silent?: boolean): void;
    /**
     * Sets a collection of key-value pairs.  Note that this changes any existing
     * properties and adds new ones (it does not remove any existing properties).
     * @param {Object<string, *>} values Values.
     * @param {boolean} [silent] Update without triggering an event.
     * @api
     */
    setProperties(values: {
        [x: string]: any;
    }, silent?: boolean): void;
    /**
     * Apply any properties from another object without triggering events.
     * @param {BaseObject} source The source object.
     * @protected
     */
    protected applyProperties(source: BaseObject): void;
    /**
     * Unsets a property.
     * @param {string} key Key name.
     * @param {boolean} [silent] Unset without triggering an event.
     * @api
     */
    unset(key: string, silent?: boolean): void;
}

/**
 * The coordinate layout for geometries, indicating whether a 3rd or 4th z ('Z')
 * or measure ('M') coordinate is available.
 */
type GeometryLayout = "XY" | "XYZ" | "XYM" | "XYZM";
/**
 * The geometry type.  One of `'Point'`, `'LineString'`, `'LinearRing'`,
 * `'Polygon'`, `'MultiPoint'`, `'MultiLineString'`, `'MultiPolygon'`,
 * `'GeometryCollection'`, or `'Circle'`.
 */
type Type$5 = "Point" | "LineString" | "LinearRing" | "Polygon" | "MultiPoint" | "MultiLineString" | "MultiPolygon" | "GeometryCollection" | "Circle";
/**
 * @classdesc
 * Abstract base class; normally only used for creating subclasses and not
 * instantiated in apps.
 * Base class for vector geometries.
 *
 * To get notified of changes to the geometry, register a listener for the
 * generic `change` event on your geometry instance.
 *
 * @abstract
 * @api
 */
declare class Geometry extends BaseObject {
    constructor();
    /**
     * @private
     * @type {import("../extent.js").Extent}
     */
    private extent_;
    /**
     * @private
     * @type {number}
     */
    private extentRevision_;
    /**
     * @protected
     * @type {number}
     */
    protected simplifiedGeometryMaxMinSquaredTolerance: number;
    /**
     * @protected
     * @type {number}
     */
    protected simplifiedGeometryRevision: number;
    /**
     * Get a transformed and simplified version of the geometry.
     * @abstract
     * @param {number} revision The geometry revision.
     * @param {number} squaredTolerance Squared tolerance.
     * @param {import("../proj.js").TransformFunction} [transform] Optional transform function.
     * @return {Geometry} Simplified geometry.
     */
    simplifyTransformedInternal: (...arg0: any[]) => Geometry;
    /**
     * Get a transformed and simplified version of the geometry.
     * @abstract
     * @param {number} squaredTolerance Squared tolerance.
     * @param {import("../proj.js").TransformFunction} [transform] Optional transform function.
     * @return {Geometry} Simplified geometry.
     */
    simplifyTransformed(squaredTolerance: number, transform?: TransformFunction): Geometry;
    /**
     * Make a complete copy of the geometry.
     * @abstract
     * @return {!Geometry} Clone.
     */
    clone(): Geometry;
    /**
     * @abstract
     * @param {number} x X.
     * @param {number} y Y.
     * @param {import("../coordinate.js").Coordinate} closestPoint Closest point.
     * @param {number} minSquaredDistance Minimum squared distance.
     * @return {number} Minimum squared distance.
     */
    closestPointXY(x: number, y: number, closestPoint: Coordinate, minSquaredDistance: number): number;
    /**
     * @param {number} x X.
     * @param {number} y Y.
     * @return {boolean} Contains (x, y).
     */
    containsXY(x: number, y: number): boolean;
    /**
     * Return the closest point of the geometry to the passed point as
     * {@link module:ol/coordinate~Coordinate coordinate}.
     * @param {import("../coordinate.js").Coordinate} point Point.
     * @param {import("../coordinate.js").Coordinate} [closestPoint] Closest point.
     * @return {import("../coordinate.js").Coordinate} Closest point.
     * @api
     */
    getClosestPoint(point: Coordinate, closestPoint?: Coordinate): Coordinate;
    /**
     * Returns true if this geometry includes the specified coordinate. If the
     * coordinate is on the boundary of the geometry, returns false.
     * @param {import("../coordinate.js").Coordinate} coordinate Coordinate.
     * @return {boolean} Contains coordinate.
     * @api
     */
    intersectsCoordinate(coordinate: Coordinate): boolean;
    /**
     * @abstract
     * @param {import("../extent.js").Extent} extent Extent.
     * @protected
     * @return {import("../extent.js").Extent} extent Extent.
     */
    protected computeExtent(extent: Extent): Extent;
    /**
     * Get the extent of the geometry.
     * @param {import("../extent.js").Extent} [extent] Extent.
     * @return {import("../extent.js").Extent} extent Extent.
     * @api
     */
    getExtent(extent?: Extent): Extent;
    /**
     * Rotate the geometry around a given coordinate. This modifies the geometry
     * coordinates in place.
     * @abstract
     * @param {number} angle Rotation angle in radians.
     * @param {import("../coordinate.js").Coordinate} anchor The rotation center.
     * @api
     */
    rotate(angle: number, anchor: Coordinate): void;
    /**
     * Scale the geometry (with an optional origin).  This modifies the geometry
     * coordinates in place.
     * @abstract
     * @param {number} sx The scaling factor in the x-direction.
     * @param {number} [sy] The scaling factor in the y-direction (defaults to sx).
     * @param {import("../coordinate.js").Coordinate} [anchor] The scale origin (defaults to the center
     *     of the geometry extent).
     * @api
     */
    scale(sx: number, sy?: number, anchor?: Coordinate): void;
    /**
     * Create a simplified version of this geometry.  For linestrings, this uses
     * the [Douglas Peucker](https://en.wikipedia.org/wiki/Ramer-Douglas-Peucker_algorithm)
     * algorithm.  For polygons, a quantization-based
     * simplification is used to preserve topology.
     * @param {number} tolerance The tolerance distance for simplification.
     * @return {Geometry} A new, simplified version of the original geometry.
     * @api
     */
    simplify(tolerance: number): Geometry;
    /**
     * Create a simplified version of this geometry using the Douglas Peucker
     * algorithm.
     * See https://en.wikipedia.org/wiki/Ramer-Douglas-Peucker_algorithm.
     * @abstract
     * @param {number} squaredTolerance Squared tolerance.
     * @return {Geometry} Simplified geometry.
     */
    getSimplifiedGeometry(squaredTolerance: number): Geometry;
    /**
     * Get the type of this geometry.
     * @abstract
     * @return {Type} Geometry type.
     */
    getType(): Type$5;
    /**
     * Apply a transform function to the coordinates of the geometry.
     * The geometry is modified in place.
     * If you do not want the geometry modified in place, first `clone()` it and
     * then use this function on the clone.
     * @abstract
     * @param {import("../proj.js").TransformFunction} transformFn Transform function.
     * Called with a flat array of geometry coordinates.
     */
    applyTransform(transformFn: TransformFunction): void;
    /**
     * Test if the geometry and the passed extent intersect.
     * @abstract
     * @param {import("../extent.js").Extent} extent Extent.
     * @return {boolean} `true` if the geometry and the extent intersect.
     */
    intersectsExtent(extent: Extent): boolean;
    /**
     * Translate the geometry.  This modifies the geometry coordinates in place.  If
     * instead you want a new geometry, first `clone()` this geometry.
     * @abstract
     * @param {number} deltaX Delta X.
     * @param {number} deltaY Delta Y.
     * @api
     */
    translate(deltaX: number, deltaY: number): void;
    /**
     * Transform each coordinate of the geometry from one coordinate reference
     * system to another. The geometry is modified in place.
     * For example, a line will be transformed to a line and a circle to a circle.
     * If you do not want the geometry modified in place, first `clone()` it and
     * then use this function on the clone.
     *
     * @param {import("../proj.js").ProjectionLike} source The current projection.  Can be a
     *     string identifier or a {@link module:ol/proj/Projection~Projection} object.
     * @param {import("../proj.js").ProjectionLike} destination The desired projection.  Can be a
     *     string identifier or a {@link module:ol/proj/Projection~Projection} object.
     * @return {this} This geometry.  Note that original geometry is
     *     modified in place.
     * @api
     */
    transform(source: ProjectionLike, destination: ProjectionLike): this;
}

/**
 * An array with two elements, representing a pixel. The first element is the
 * x-coordinate, the second the y-coordinate of the pixel.
 */
type Pixel = Array<number>;

/**
 * An array representing an affine 2d transformation for use with
 * {@link module :ol/transform} functions. The array has 6 elements.
 */
type Transform = Array<number>;

/**
 * @classdesc
 * Abstract base class; only used for creating subclasses; do not instantiate
 * in apps, as cannot be rendered.
 *
 * @abstract
 * @api
 */
declare class SimpleGeometry extends Geometry {
    /**
     * @protected
     * @type {import("./Geometry.js").GeometryLayout}
     */
    protected layout: GeometryLayout;
    /**
     * @protected
     * @type {number}
     */
    protected stride: number;
    /**
     * @protected
     * @type {Array<number>}
     */
    protected flatCoordinates: Array<number>;
    /**
     * @abstract
     * @return {Array<*> | null} Coordinates.
     */
    getCoordinates(): Array<any> | null;
    /**
     * Return the first coordinate of the geometry.
     * @return {import("../coordinate.js").Coordinate} First coordinate.
     * @api
     */
    getFirstCoordinate(): Coordinate;
    /**
     * @return {Array<number>} Flat coordinates.
     */
    getFlatCoordinates(): Array<number>;
    /**
     * Return the last coordinate of the geometry.
     * @return {import("../coordinate.js").Coordinate} Last point.
     * @api
     */
    getLastCoordinate(): Coordinate;
    /**
     * Return the {@link import("./Geometry.js").GeometryLayout layout} of the geometry.
     * @return {import("./Geometry.js").GeometryLayout} Layout.
     * @api
     */
    getLayout(): GeometryLayout;
    /**
     * Create a simplified version of this geometry using the Douglas Peucker algorithm.
     * @param {number} squaredTolerance Squared tolerance.
     * @return {SimpleGeometry} Simplified geometry.
     * @override
     */
    override getSimplifiedGeometry(squaredTolerance: number): SimpleGeometry;
    /**
     * @param {number} squaredTolerance Squared tolerance.
     * @return {SimpleGeometry} Simplified geometry.
     * @protected
     */
    protected getSimplifiedGeometryInternal(squaredTolerance: number): SimpleGeometry;
    /**
     * @return {number} Stride.
     */
    getStride(): number;
    /**
     * @param {import("./Geometry.js").GeometryLayout} layout Layout.
     * @param {Array<number>} flatCoordinates Flat coordinates.
     */
    setFlatCoordinates(layout: GeometryLayout, flatCoordinates: Array<number>): void;
    /**
     * @abstract
     * @param {!Array<*>} coordinates Coordinates.
     * @param {import("./Geometry.js").GeometryLayout} [layout] Layout.
     */
    setCoordinates(coordinates: Array<any>, layout?: GeometryLayout): void;
    /**
     * @param {import("./Geometry.js").GeometryLayout|undefined} layout Layout.
     * @param {Array<*>} coordinates Coordinates.
     * @param {number} nesting Nesting.
     * @protected
     */
    protected setLayout(layout: GeometryLayout | undefined, coordinates: Array<any>, nesting: number): void;
}

/**
 * @classdesc
 * Circle geometry.
 *
 * @api
 */
declare class Circle extends SimpleGeometry {
    /**
     * @param {!import("../coordinate.js").Coordinate} center Center.
     *     For internal use, flat coordinates in combination with `layout` and no
     *     `radius` are also accepted.
     * @param {number} [radius] Radius in units of the projection.
     * @param {import("./Geometry.js").GeometryLayout} [layout] Layout.
     */
    constructor(center: Coordinate, radius?: number, layout?: GeometryLayout);
    /**
     * Make a complete copy of the geometry.
     * @return {!Circle} Clone.
     * @api
     * @override
     */
    override clone(): Circle;
    /**
     * Return the center of the circle as {@link module:ol/coordinate~Coordinate coordinate}.
     * @return {import("../coordinate.js").Coordinate} Center.
     * @api
     */
    getCenter(): Coordinate;
    /**
     * Return the radius of the circle.
     * @return {number} Radius.
     * @api
     */
    getRadius(): number;
    /**
     * @private
     * @return {number} Radius squared.
     */
    private getRadiusSquared_;
    /**
     * Set the center of the circle as {@link module:ol/coordinate~Coordinate coordinate}.
     * @param {import("../coordinate.js").Coordinate} center Center.
     * @api
     */
    setCenter(center: Coordinate): void;
    /**
     * Set the center (as {@link module:ol/coordinate~Coordinate coordinate}) and the radius (as
     * number) of the circle.
     * @param {!import("../coordinate.js").Coordinate} center Center.
     * @param {number} radius Radius.
     * @param {import("./Geometry.js").GeometryLayout} [layout] Layout.
     * @api
     */
    setCenterAndRadius(center: Coordinate, radius: number, layout?: GeometryLayout): void;
    /**
     * @override
     */
    override getCoordinates(): null;
    /**
     * @override
     */
    override setCoordinates(coordinates: any, layout: any): void;
    /**
     * Set the radius of the circle. The radius is in the units of the projection.
     * @param {number} radius Radius.
     * @api
     */
    setRadius(radius: number): void;
}
//# sourceMappingURL=Circle.d.ts.map

/**
 * An array of numbers representing an `xy`, `xyz` or `xyzm` coordinate.
 * Example: `[16, 48]`.
 */
type Coordinate = Array<number>;

/**
 * An array of numbers representing an extent: `[minx, miny, maxx, maxy]`.
 */
type Extent = Array<number>;

/**
 * @typedef {Object} MetersPerUnitLookup
 * @property {number} radians Radians
 * @property {number} degrees Degrees
 * @property {number} ft  Feet
 * @property {number} m Meters
 * @property {number} us-ft US feet
 */
/**
 * Meters per unit lookup table.
 * @const
 * @type {MetersPerUnitLookup}
 * @api
 */
declare const METERS_PER_UNIT: MetersPerUnitLookup;
/**
 * Projection units.
 */
type Units = "radians" | "degrees" | "ft" | "m" | "pixels" | "tile-pixels" | "us-ft";
type MetersPerUnitLookup = {
    /**
     * Radians
     */
    radians: number;
    /**
     * Degrees
     */
    degrees: number;
    /**
     * Feet
     */
    ft: number;
    /**
     * Meters
     */
    m: number;
    /**
     * US feet
     */
    "us-ft": number;
};

/**
 * @param {boolean} [disable] Disable console info about `useGeographic()`
 */
declare function disableCoordinateWarning(disable?: boolean): void;
/**
 * @param {Array<number>} input Input coordinate array.
 * @param {Array<number>} [output] Output array of coordinate values.
 * @return {Array<number>} Output coordinate array (new array, same coordinate
 *     values).
 */
declare function cloneTransform(input: Array<number>, output?: Array<number>): Array<number>;
/**
 * @param {Array<number>} input Input coordinate array.
 * @param {Array<number>} [output] Output array of coordinate values.
 * @return {Array<number>} Input coordinate array (same array as input).
 */
declare function identityTransform(input: Array<number>, output?: Array<number>): Array<number>;
/**
 * Add a Projection object to the list of supported projections that can be
 * looked up by their code.
 *
 * @param {Projection} projection Projection instance.
 * @api
 */
declare function addProjection(projection: Projection): void;
/**
 * @param {Array<Projection>} projections Projections.
 */
declare function addProjections(projections: Array<Projection>): void;
/**
 * Fetches a Projection object for the code specified.
 *
 * @param {ProjectionLike} projectionLike Either a code string which is
 *     a combination of authority and identifier such as "EPSG:4326", or an
 *     existing projection object, or undefined.
 * @return {Projection|null} Projection object, or null if not in list.
 * @api
 */
declare function get(projectionLike: ProjectionLike): Projection | null;
/**
 * Get the resolution of the point in degrees or distance units.
 * For projections with degrees as the unit this will simply return the
 * provided resolution. For other projections the point resolution is
 * by default estimated by transforming the `point` pixel to EPSG:4326,
 * measuring its width and height on the normal sphere,
 * and taking the average of the width and height.
 * A custom function can be provided for a specific projection, either
 * by setting the `getPointResolution` option in the
 * {@link module:ol/proj/Projection~Projection} constructor or by using
 * {@link module:ol/proj/Projection~Projection#setGetPointResolution} to change an existing
 * projection object.
 * @param {ProjectionLike} projection The projection.
 * @param {number} resolution Nominal resolution in projection units.
 * @param {import("./coordinate.js").Coordinate} point Point to find adjusted resolution at.
 * @param {import("./proj/Units.js").Units} [units] Units to get the point resolution in.
 * Default is the projection's units.
 * @return {number} Point resolution.
 * @api
 */
declare function getPointResolution(projection: ProjectionLike, resolution: number, point: Coordinate, units?: Units): number;
/**
 * Registers transformation functions that don't alter coordinates. Those allow
 * to transform between projections with equal meaning.
 *
 * @param {Array<Projection>} projections Projections.
 * @api
 */
declare function addEquivalentProjections(projections: Array<Projection>): void;
/**
 * Registers transformation functions to convert coordinates in any projection
 * in projection1 to any projection in projection2.
 *
 * @param {Array<Projection>} projections1 Projections with equal
 *     meaning.
 * @param {Array<Projection>} projections2 Projections with equal
 *     meaning.
 * @param {TransformFunction} forwardTransform Transformation from any
 *   projection in projection1 to any projection in projection2.
 * @param {TransformFunction} inverseTransform Transform from any projection
 *   in projection2 to any projection in projection1..
 */
declare function addEquivalentTransforms(projections1: Array<Projection>, projections2: Array<Projection>, forwardTransform: TransformFunction, inverseTransform: TransformFunction): void;
/**
 * Clear all cached projections and transforms.
 */
declare function clearAllProjections(): void;
/**
 * @param {Projection|string|undefined} projection Projection.
 * @param {string} defaultCode Default code.
 * @return {Projection} Projection.
 */
declare function createProjection(projection: Projection | string | undefined, defaultCode: string): Projection;
/**
 * Creates a {@link module:ol/proj~TransformFunction} from a simple 2D coordinate transform
 * function.
 * @param {function(import("./coordinate.js").Coordinate): import("./coordinate.js").Coordinate} coordTransform Coordinate
 *     transform.
 * @return {TransformFunction} Transform function.
 */
declare function createTransformFromCoordinateTransform(coordTransform: (arg0: Coordinate) => Coordinate): TransformFunction;
/**
 * Registers coordinate transform functions to convert coordinates between the
 * source projection and the destination projection.
 * The forward and inverse functions convert coordinate pairs; this function
 * converts these into the functions used internally which also handle
 * extents and coordinate arrays.
 *
 * @param {ProjectionLike} source Source projection.
 * @param {ProjectionLike} destination Destination projection.
 * @param {function(import("./coordinate.js").Coordinate): import("./coordinate.js").Coordinate} forward The forward transform
 *     function (that is, from the source projection to the destination
 *     projection) that takes a {@link module:ol/coordinate~Coordinate} as argument and returns
 *     the transformed {@link module:ol/coordinate~Coordinate}.
 * @param {function(import("./coordinate.js").Coordinate): import("./coordinate.js").Coordinate} inverse The inverse transform
 *     function (that is, from the destination projection to the source
 *     projection) that takes a {@link module:ol/coordinate~Coordinate} as argument and returns
 *     the transformed {@link module:ol/coordinate~Coordinate}. If the transform function can only
 *     transform less dimensions than the input coordinate, it is supposeed to return a coordinate
 *     with only the length it can transform. The other dimensions will be taken unchanged from the
 *     source.
 * @api
 */
declare function addCoordinateTransforms(source: ProjectionLike, destination: ProjectionLike, forward: (arg0: Coordinate) => Coordinate, inverse: (arg0: Coordinate) => Coordinate): void;
/**
 * Transforms a coordinate from longitude/latitude to a different projection.
 * @param {import("./coordinate.js").Coordinate} coordinate Coordinate as longitude and latitude, i.e.
 *     an array with longitude as 1st and latitude as 2nd element.
 * @param {ProjectionLike} [projection] Target projection. The
 *     default is Web Mercator, i.e. 'EPSG:3857'.
 * @return {import("./coordinate.js").Coordinate} Coordinate projected to the target projection.
 * @api
 */
declare function fromLonLat(coordinate: Coordinate, projection?: ProjectionLike): Coordinate;
/**
 * Transforms a coordinate to longitude/latitude.
 * @param {import("./coordinate.js").Coordinate} coordinate Projected coordinate.
 * @param {ProjectionLike} [projection] Projection of the coordinate.
 *     The default is Web Mercator, i.e. 'EPSG:3857'.
 * @return {import("./coordinate.js").Coordinate} Coordinate as longitude and latitude, i.e. an array
 *     with longitude as 1st and latitude as 2nd element.
 * @api
 */
declare function toLonLat(coordinate: Coordinate, projection?: ProjectionLike): Coordinate;
/**
 * Checks if two projections are the same, that is every coordinate in one
 * projection does represent the same geographic point as the same coordinate in
 * the other projection.
 *
 * @param {Projection} projection1 Projection 1.
 * @param {Projection} projection2 Projection 2.
 * @return {boolean} Equivalent.
 * @api
 */
declare function equivalent(projection1: Projection, projection2: Projection): boolean;
/**
 * Searches in the list of transform functions for the function for converting
 * coordinates from the source projection to the destination projection.
 *
 * @param {Projection} source Source Projection object.
 * @param {Projection} destination Destination Projection
 *     object.
 * @return {TransformFunction|null} Transform function.
 */
declare function getTransformFromProjections(source: Projection, destination: Projection): TransformFunction | null;
/**
 * Given the projection-like objects, searches for a transformation
 * function to convert a coordinates array from the source projection to the
 * destination projection.
 *
 * @param {ProjectionLike} source Source.
 * @param {ProjectionLike} destination Destination.
 * @return {TransformFunction} Transform function.
 * @api
 */
declare function getTransform(source: ProjectionLike, destination: ProjectionLike): TransformFunction;
/**
 * Transforms a coordinate from source projection to destination projection.
 * This returns a new coordinate (and does not modify the original). If there
 * is no available transform between the two projection, the function will throw
 * an error.
 *
 * See {@link module:ol/proj.transformExtent} for extent transformation.
 * See the transform method of {@link module:ol/geom/Geometry~Geometry} and its
 * subclasses for geometry transforms.
 *
 * @param {import("./coordinate.js").Coordinate} coordinate Coordinate.
 * @param {ProjectionLike} source Source projection-like.
 * @param {ProjectionLike} destination Destination projection-like.
 * @return {import("./coordinate.js").Coordinate} Coordinate.
 * @api
 */
declare function transform(coordinate: Coordinate, source: ProjectionLike, destination: ProjectionLike): Coordinate;
/**
 * Transforms an extent from source projection to destination projection.  This
 * returns a new extent (and does not modify the original).
 *
 * @param {import("./extent.js").Extent} extent The extent to transform.
 * @param {ProjectionLike} source Source projection-like.
 * @param {ProjectionLike} destination Destination projection-like.
 * @param {number} [stops] Number of stops per side used for the transform.
 * By default only the corners are used.
 * @return {import("./extent.js").Extent} The transformed extent.
 * @api
 */
declare function transformExtent(extent: Extent, source: ProjectionLike, destination: ProjectionLike, stops?: number): Extent;
/**
 * Transforms the given point to the destination projection.
 *
 * @param {import("./coordinate.js").Coordinate} point Point.
 * @param {Projection} sourceProjection Source projection.
 * @param {Projection} destinationProjection Destination projection.
 * @return {import("./coordinate.js").Coordinate} Point.
 */
declare function transformWithProjections(point: Coordinate, sourceProjection: Projection, destinationProjection: Projection): Coordinate;
/**
 * Set the projection for coordinates supplied from and returned by API methods.
 * This includes all API methods except for those interacting with tile grids,
 * plus {@link import("./Map.js").FrameState} and {@link import("./View.js").State}.
 * @param {ProjectionLike} projection The user projection.
 * @api
 */
declare function setUserProjection(projection: ProjectionLike): void;
/**
 * Clear the user projection if set.
 * @api
 */
declare function clearUserProjection(): void;
/**
 * Get the projection for coordinates supplied from and returned by API methods.
 * @return {Projection|null} The user projection (or null if not set).
 * @api
 */
declare function getUserProjection(): Projection | null;
/**
 * Use geographic coordinates (WGS-84 datum) in API methods.
 * This includes all API methods except for those interacting with tile grids,
 * plus {@link import("./Map.js").FrameState} and {@link import("./View.js").State}.
 * @api
 */
declare function useGeographic(): void;
/**
 * Return a coordinate transformed into the user projection.  If no user projection
 * is set, the original coordinate is returned.
 * @param {Array<number>} coordinate Input coordinate.
 * @param {ProjectionLike} sourceProjection The input coordinate projection.
 * @return {Array<number>} The input coordinate in the user projection.
 */
declare function toUserCoordinate(coordinate: Array<number>, sourceProjection: ProjectionLike): Array<number>;
/**
 * Return a coordinate transformed from the user projection.  If no user projection
 * is set, the original coordinate is returned.
 * @param {Array<number>} coordinate Input coordinate.
 * @param {ProjectionLike} destProjection The destination projection.
 * @return {Array<number>} The input coordinate transformed.
 */
declare function fromUserCoordinate(coordinate: Array<number>, destProjection: ProjectionLike): Array<number>;
/**
 * Return an extent transformed into the user projection.  If no user projection
 * is set, the original extent is returned.
 * @param {import("./extent.js").Extent} extent Input extent.
 * @param {ProjectionLike} sourceProjection The input extent projection.
 * @return {import("./extent.js").Extent} The input extent in the user projection.
 */
declare function toUserExtent(extent: Extent, sourceProjection: ProjectionLike): Extent;
/**
 * Return an extent transformed from the user projection.  If no user projection
 * is set, the original extent is returned.
 * @param {import("./extent.js").Extent} extent Input extent.
 * @param {ProjectionLike} destProjection The destination projection.
 * @return {import("./extent.js").Extent} The input extent transformed.
 */
declare function fromUserExtent(extent: Extent, destProjection: ProjectionLike): Extent;
/**
 * Return the resolution in user projection units per pixel. If no user projection
 * is set, or source or user projection are missing units, the original resolution
 * is returned.
 * @param {number} resolution Resolution in input projection units per pixel.
 * @param {ProjectionLike} sourceProjection The input projection.
 * @return {number} Resolution in user projection units per pixel.
 */
declare function toUserResolution(resolution: number, sourceProjection: ProjectionLike): number;
/**
 * Return the resolution in user projection units per pixel. If no user projection
 * is set, or source or user projection are missing units, the original resolution
 * is returned.
 * @param {number} resolution Resolution in user projection units per pixel.
 * @param {ProjectionLike} destProjection The destination projection.
 * @return {number} Resolution in destination projection units per pixel.
 */
declare function fromUserResolution(resolution: number, destProjection: ProjectionLike): number;
/**
 * Creates a safe coordinate transform function from a coordinate transform function.
 * "Safe" means that it can handle wrapping of x-coordinates for global projections,
 * and that coordinates exceeding the source projection validity extent's range will be
 * clamped to the validity range.
 * @param {Projection} sourceProj Source projection.
 * @param {Projection} destProj Destination projection.
 * @param {function(import("./coordinate.js").Coordinate): import("./coordinate.js").Coordinate} transform Transform function (source to destination).
 * @return {function(import("./coordinate.js").Coordinate): import("./coordinate.js").Coordinate} Safe transform function (source to destination).
 */
declare function createSafeCoordinateTransform(sourceProj: Projection, destProj: Projection, transform: (arg0: Coordinate) => Coordinate): (arg0: Coordinate) => Coordinate;
/**
 * Add transforms to and from EPSG:4326 and EPSG:3857.  This function is called
 * by when this module is executed and should only need to be called again after
 * `clearAllProjections()` is called (e.g. in tests).
 */
declare function addCommon(): void;
/**
 * A projection as {@link module :ol/proj/Projection~Projection}, SRS identifier
 * string or undefined.
 */
type ProjectionLike = Projection | string | undefined;
type Transforms = {
    /**
     * The forward transform (from geographic).
     */
    forward: TransformFunction;
    /**
     * The inverse transform (to geographic).
     */
    inverse: TransformFunction;
};
/**
 * A transform function accepts an array of input coordinate values, an optional
 * output array, and an optional dimension (default should be 2).  The function
 * transforms the input coordinate values, populates the output array, and
 * returns the output array.
 */
type TransformFunction = (input: Array<number>, output?: number[] | undefined, dimension?: number | undefined, stride?: number | undefined) => Array<number>;

declare const proj_d_METERS_PER_UNIT: typeof METERS_PER_UNIT;
type proj_d_Projection = Projection;
declare const proj_d_Projection: typeof Projection;
type proj_d_ProjectionLike = ProjectionLike;
type proj_d_TransformFunction = TransformFunction;
type proj_d_Transforms = Transforms;
declare const proj_d_addCommon: typeof addCommon;
declare const proj_d_addCoordinateTransforms: typeof addCoordinateTransforms;
declare const proj_d_addEquivalentProjections: typeof addEquivalentProjections;
declare const proj_d_addEquivalentTransforms: typeof addEquivalentTransforms;
declare const proj_d_addProjection: typeof addProjection;
declare const proj_d_addProjections: typeof addProjections;
declare const proj_d_clearAllProjections: typeof clearAllProjections;
declare const proj_d_clearUserProjection: typeof clearUserProjection;
declare const proj_d_cloneTransform: typeof cloneTransform;
declare const proj_d_createProjection: typeof createProjection;
declare const proj_d_createSafeCoordinateTransform: typeof createSafeCoordinateTransform;
declare const proj_d_createTransformFromCoordinateTransform: typeof createTransformFromCoordinateTransform;
declare const proj_d_disableCoordinateWarning: typeof disableCoordinateWarning;
declare const proj_d_equivalent: typeof equivalent;
declare const proj_d_fromLonLat: typeof fromLonLat;
declare const proj_d_fromUserCoordinate: typeof fromUserCoordinate;
declare const proj_d_fromUserExtent: typeof fromUserExtent;
declare const proj_d_fromUserResolution: typeof fromUserResolution;
declare const proj_d_get: typeof get;
declare const proj_d_getPointResolution: typeof getPointResolution;
declare const proj_d_getTransform: typeof getTransform;
declare const proj_d_getTransformFromProjections: typeof getTransformFromProjections;
declare const proj_d_getUserProjection: typeof getUserProjection;
declare const proj_d_identityTransform: typeof identityTransform;
declare const proj_d_setUserProjection: typeof setUserProjection;
declare const proj_d_toLonLat: typeof toLonLat;
declare const proj_d_toUserCoordinate: typeof toUserCoordinate;
declare const proj_d_toUserExtent: typeof toUserExtent;
declare const proj_d_toUserResolution: typeof toUserResolution;
declare const proj_d_transform: typeof transform;
declare const proj_d_transformExtent: typeof transformExtent;
declare const proj_d_transformWithProjections: typeof transformWithProjections;
declare const proj_d_useGeographic: typeof useGeographic;
declare namespace proj_d {
  export { proj_d_METERS_PER_UNIT as METERS_PER_UNIT, proj_d_Projection as Projection, type proj_d_ProjectionLike as ProjectionLike, type proj_d_TransformFunction as TransformFunction, type proj_d_Transforms as Transforms, proj_d_addCommon as addCommon, proj_d_addCoordinateTransforms as addCoordinateTransforms, proj_d_addEquivalentProjections as addEquivalentProjections, proj_d_addEquivalentTransforms as addEquivalentTransforms, proj_d_addProjection as addProjection, proj_d_addProjections as addProjections, proj_d_clearAllProjections as clearAllProjections, proj_d_clearUserProjection as clearUserProjection, proj_d_cloneTransform as cloneTransform, proj_d_createProjection as createProjection, proj_d_createSafeCoordinateTransform as createSafeCoordinateTransform, proj_d_createTransformFromCoordinateTransform as createTransformFromCoordinateTransform, proj_d_disableCoordinateWarning as disableCoordinateWarning, proj_d_equivalent as equivalent, proj_d_fromLonLat as fromLonLat, proj_d_fromUserCoordinate as fromUserCoordinate, proj_d_fromUserExtent as fromUserExtent, proj_d_fromUserResolution as fromUserResolution, proj_d_get as get, proj_d_getPointResolution as getPointResolution, proj_d_getTransform as getTransform, proj_d_getTransformFromProjections as getTransformFromProjections, proj_d_getUserProjection as getUserProjection, proj_d_identityTransform as identityTransform, proj_d_setUserProjection as setUserProjection, proj_d_toLonLat as toLonLat, proj_d_toUserCoordinate as toUserCoordinate, proj_d_toUserExtent as toUserExtent, proj_d_toUserResolution as toUserResolution, proj_d_transform as transform, proj_d_transformExtent as transformExtent, proj_d_transformWithProjections as transformWithProjections, proj_d_useGeographic as useGeographic };
}

/**
 * A color represented as a short array [red, green, blue, alpha].
 * red, green, and blue should be integers in the range 0..255 inclusive.
 * alpha should be a float in the range 0..1 inclusive. If no alpha value is
 * given then `1` will be used.
 */
type Color = Array<number>;

type PatternDescriptor = {
    /**
     * Pattern image URL
     */
    src: string;
    /**
     * Color to tint the pattern with.
     */
    color?: string | Color | undefined;
    /**
     * Size of the desired slice from the pattern image.
     * Use this together with `offset` when the pattern image is a sprite sheet.
     */
    size?: Size | undefined;
    /**
     * Offset of the desired slice from the pattern image.
     * Use this together with `size` when the pattern image is a sprite sheet.
     */
    offset?: Size | undefined;
};
/**
 * A type accepted by CanvasRenderingContext2D.fillStyle
 * or CanvasRenderingContext2D.strokeStyle.
 * Represents a color, [CanvasPattern](https://developer.mozilla.org/en-US/docs/Web/API/CanvasPattern),
 * or [CanvasGradient](https://developer.mozilla.org/en-US/docs/Web/API/CanvasGradient). The origin for
 * patterns and gradients as fill style is an increment of 512 css pixels from map coordinate
 * `[0, 0]`. For seamless repeat patterns, width and height of the pattern image
 * must be a factor of two (2, 4, 8, ..., 512).
 */
type ColorLike = string | CanvasPattern | CanvasGradient;

type Options$G = {
    /**
     * A color, gradient or pattern.
     * See {@link module :ol/color~Color} and {@link module :ol/colorlike~ColorLike} for possible formats.
     * Default null; if null, the Canvas/renderer default black will be used.
     */
    color?: Color | ColorLike | undefined;
    /**
     * Line cap style: `butt`, `round`, or `square`.
     */
    lineCap?: CanvasLineCap | undefined;
    /**
     * Line join style: `bevel`, `round`, or `miter`.
     */
    lineJoin?: CanvasLineJoin | undefined;
    /**
     * Line dash pattern. Default is `null` (no dash).
     */
    lineDash?: number[] | undefined;
    /**
     * Line dash offset.
     */
    lineDashOffset?: number | undefined;
    /**
     * Miter limit.
     */
    miterLimit?: number | undefined;
    /**
     * Width.
     */
    width?: number | undefined;
};
/**
 * @module ol/style/Stroke
 */
/**
 * @typedef {Object} Options
 * @property {import("../color.js").Color|import("../colorlike.js").ColorLike} [color] A color, gradient or pattern.
 * See {@link module:ol/color~Color} and {@link module:ol/colorlike~ColorLike} for possible formats.
 * Default null; if null, the Canvas/renderer default black will be used.
 * @property {CanvasLineCap} [lineCap='round'] Line cap style: `butt`, `round`, or `square`.
 * @property {CanvasLineJoin} [lineJoin='round'] Line join style: `bevel`, `round`, or `miter`.
 * @property {Array<number>} [lineDash] Line dash pattern. Default is `null` (no dash).
 * @property {number} [lineDashOffset=0] Line dash offset.
 * @property {number} [miterLimit=10] Miter limit.
 * @property {number} [width] Width.
 */
/**
 * @classdesc
 * Set stroke style for vector features.
 * Note that the defaults given are the Canvas defaults, which will be used if
 * option is not defined. The `get` functions return whatever was entered in
 * the options; they will not return the default.
 * @api
 */
declare class Stroke {
    /**
     * @param {Options} [options] Options.
     */
    constructor(options?: Options$G);
    /**
     * @private
     * @type {import("../color.js").Color|import("../colorlike.js").ColorLike}
     */
    private color_;
    /**
     * @private
     * @type {CanvasLineCap|undefined}
     */
    private lineCap_;
    /**
     * @private
     * @type {Array<number>|null}
     */
    private lineDash_;
    /**
     * @private
     * @type {number|undefined}
     */
    private lineDashOffset_;
    /**
     * @private
     * @type {CanvasLineJoin|undefined}
     */
    private lineJoin_;
    /**
     * @private
     * @type {number|undefined}
     */
    private miterLimit_;
    /**
     * @private
     * @type {number|undefined}
     */
    private width_;
    /**
     * Clones the style.
     * @return {Stroke} The cloned style.
     * @api
     */
    clone(): Stroke;
    /**
     * Get the stroke color.
     * @return {import("../color.js").Color|import("../colorlike.js").ColorLike} Color.
     * @api
     */
    getColor(): Color | ColorLike;
    /**
     * Get the line cap type for the stroke.
     * @return {CanvasLineCap|undefined} Line cap.
     * @api
     */
    getLineCap(): CanvasLineCap | undefined;
    /**
     * Get the line dash style for the stroke.
     * @return {Array<number>|null} Line dash.
     * @api
     */
    getLineDash(): Array<number> | null;
    /**
     * Get the line dash offset for the stroke.
     * @return {number|undefined} Line dash offset.
     * @api
     */
    getLineDashOffset(): number | undefined;
    /**
     * Get the line join type for the stroke.
     * @return {CanvasLineJoin|undefined} Line join.
     * @api
     */
    getLineJoin(): CanvasLineJoin | undefined;
    /**
     * Get the miter limit for the stroke.
     * @return {number|undefined} Miter limit.
     * @api
     */
    getMiterLimit(): number | undefined;
    /**
     * Get the stroke width.
     * @return {number|undefined} Width.
     * @api
     */
    getWidth(): number | undefined;
    /**
     * Set the color.
     *
     * @param {import("../color.js").Color|import("../colorlike.js").ColorLike} color Color.
     * @api
     */
    setColor(color: Color | ColorLike): void;
    /**
     * Set the line cap.
     *
     * @param {CanvasLineCap|undefined} lineCap Line cap.
     * @api
     */
    setLineCap(lineCap: CanvasLineCap | undefined): void;
    /**
     * Set the line dash.
     *
     * @param {Array<number>|null} lineDash Line dash.
     * @api
     */
    setLineDash(lineDash: Array<number> | null): void;
    /**
     * Set the line dash offset.
     *
     * @param {number|undefined} lineDashOffset Line dash offset.
     * @api
     */
    setLineDashOffset(lineDashOffset: number | undefined): void;
    /**
     * Set the line join.
     *
     * @param {CanvasLineJoin|undefined} lineJoin Line join.
     * @api
     */
    setLineJoin(lineJoin: CanvasLineJoin | undefined): void;
    /**
     * Set the miter limit.
     *
     * @param {number|undefined} miterLimit Miter limit.
     * @api
     */
    setMiterLimit(miterLimit: number | undefined): void;
    /**
     * Set the width.
     *
     * @param {number|undefined} width Width.
     * @api
     */
    setWidth(width: number | undefined): void;
}

type Options$F = {
    /**
     * A color,
     * gradient or pattern.
     * See {@link module :ol/color~Color} and {@link module :ol/colorlike~ColorLike} for possible formats. For polygon fills (not for {@link import ("./RegularShape.js").default} fills),
     * a pattern can also be provided as {@link module :ol/colorlike~PatternDescriptor}.
     * Default null; if null, the Canvas/renderer default black will be used.
     */
    color?: Color | ColorLike | PatternDescriptor | null | undefined;
};
/**
 * @typedef {Object} Options
 * @property {import("../color.js").Color|import("../colorlike.js").ColorLike|import('../colorlike.js').PatternDescriptor|null} [color=null] A color,
 * gradient or pattern.
 * See {@link module:ol/color~Color} and {@link module:ol/colorlike~ColorLike} for possible formats. For polygon fills (not for {@link import("./RegularShape.js").default} fills),
 * a pattern can also be provided as {@link module:ol/colorlike~PatternDescriptor}.
 * Default null; if null, the Canvas/renderer default black will be used.
 */
/**
 * @classdesc
 * Set fill style for vector features.
 * @api
 */
declare class Fill {
    /**
     * @param {Options} [options] Options.
     */
    constructor(options?: Options$F);
    /**
     * @private
     * @type {import("./IconImage.js").default|null}
     */
    private patternImage_;
    /**
     * @private
     * @type {import("../color.js").Color|import("../colorlike.js").ColorLike|import('../colorlike.js').PatternDescriptor|null}
     */
    private color_;
    /**
     * Clones the style. The color is not cloned if it is a {@link module:ol/colorlike~ColorLike}.
     * @return {Fill} The cloned style.
     * @api
     */
    clone(): Fill;
    /**
     * Get the fill color.
     * @return {import("../color.js").Color|import("../colorlike.js").ColorLike|import('../colorlike.js').PatternDescriptor|null} Color.
     * @api
     */
    getColor(): Color | ColorLike | PatternDescriptor | null;
    /**
     * Set the color.
     *
     * @param {import("../color.js").Color|import("../colorlike.js").ColorLike|import('../colorlike.js').PatternDescriptor|null} color Color.
     * @api
     */
    setColor(color: Color | ColorLike | PatternDescriptor | null): void;
    /**
     * @return {string} Key of the fill for cache lookup.
     */
    getKey(): string;
    /**
     * @return {boolean} The fill style is loading an image pattern.
     */
    loading(): boolean;
    /**
     * @return {Promise<void>} `false` or a promise that resolves when the style is ready to use.
     */
    ready(): Promise<void>;
}

/**
 * Default text placement is `'point'`. Note that
 * `'line'` requires the underlying geometry to be a {@link module :ol/geom/LineString~LineString},
 * {@link module :ol/geom/Polygon~Polygon}, {@link module :ol/geom/MultiLineString~MultiLineString} or
 * {@link module :ol/geom/MultiPolygon~MultiPolygon}.
 */
type TextPlacement = "point" | "line";
type TextJustify = "left" | "center" | "right";
type Options$E = {
    /**
     * Font style as CSS `font` value, see:
     * https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/font. Default is `'10px sans-serif'`
     */
    font?: string | undefined;
    /**
     * When `placement` is set to `'line'`, allow a maximum angle between adjacent characters.
     * The expected value is in radians, and the default is 45° (`Math.PI / 4`).
     */
    maxAngle?: number | undefined;
    /**
     * Horizontal text offset in pixels. A positive will shift the text right.
     */
    offsetX?: number | undefined;
    /**
     * Vertical text offset in pixels. A positive will shift the text down.
     */
    offsetY?: number | undefined;
    /**
     * For polygon labels or when `placement` is set to `'line'`, allow text to exceed
     * the width of the polygon at the label position or the length of the path that it follows.
     */
    overflow?: boolean | undefined;
    /**
     * Text placement.
     */
    placement?: TextPlacement | undefined;
    /**
     * Repeat interval. When set, the text will be repeated at this interval, which specifies
     * the distance between two text anchors in pixels. Only available when `placement` is set to `'line'`. Overrides 'textAlign'.
     */
    repeat?: number | undefined;
    /**
     * Scale.
     */
    scale?: number | Size | undefined;
    /**
     * Whether to rotate the text with the view.
     */
    rotateWithView?: boolean | undefined;
    /**
     * Whether the text can be rotated 180° to prevent being rendered upside down.
     */
    keepUpright?: boolean | undefined;
    /**
     * Rotation in radians (positive rotation clockwise).
     */
    rotation?: number | undefined;
    /**
     * Text content or rich text content. For plain text provide a string, which can
     * contain line breaks (`\n`). For rich text provide an array of text/font tuples. A tuple consists of the text to
     * render and the font to use (or `''` to use the text style's font). A line break has to be a separate tuple (i.e. `'\n', ''`).
     * **Example:** `['foo', 'bold 10px sans-serif', ' bar', 'italic 10px sans-serif', ' baz', '']` will yield "**foo** *bar* baz".
     * **Note:** Rich text is not supported for `placement: 'line'` or the immediate rendering API.
     */
    text?: string | string[] | undefined;
    /**
     * Text alignment. Possible values: `'left'`, `'right'`, `'center'`, `'end'` or `'start'`.
     * Default is `'center'` for `placement: 'point'`. For `placement: 'line'`, the default is to let the renderer choose a
     * placement where `maxAngle` is not exceeded.
     */
    textAlign?: CanvasTextAlign | undefined;
    /**
     * Text justification within the text box.
     * If not set, text is justified towards the `textAlign` anchor.
     * Otherwise, use options `'left'`, `'center'`, or `'right'` to justify the text within the text box.
     * **Note:** `justify` is ignored for immediate rendering and also for `placement: 'line'`.
     */
    justify?: TextJustify | undefined;
    /**
     * Text base line. Possible values: `'bottom'`, `'top'`, `'middle'`, `'alphabetic'`,
     * `'hanging'`, `'ideographic'`.
     */
    textBaseline?: CanvasTextBaseline | undefined;
    /**
     * Fill style. If none is provided, we'll use a dark fill-style (#333). Specify `null` for no fill.
     */
    fill?: Fill | null | undefined;
    /**
     * Stroke style.
     */
    stroke?: Stroke | undefined;
    /**
     * Fill style for the text background when `placement` is
     * `'point'`. Default is no fill.
     */
    backgroundFill?: Fill | undefined;
    /**
     * Stroke style for the text background  when `placement`
     * is `'point'`. Default is no stroke.
     */
    backgroundStroke?: Stroke | undefined;
    /**
     * Padding in pixels around the text for decluttering and background. The order of
     * values in the array is `[top, right, bottom, left]`.
     */
    padding?: number[] | undefined;
    /**
     * Declutter mode: `declutter`, `obstacle`, `none`
     */
    declutterMode?: DeclutterMode | undefined;
};
/**
 * @typedef {Object} Options
 * @property {string} [font] Font style as CSS `font` value, see:
 * https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/font. Default is `'10px sans-serif'`
 * @property {number} [maxAngle=Math.PI/4] When `placement` is set to `'line'`, allow a maximum angle between adjacent characters.
 * The expected value is in radians, and the default is 45° (`Math.PI / 4`).
 * @property {number} [offsetX=0] Horizontal text offset in pixels. A positive will shift the text right.
 * @property {number} [offsetY=0] Vertical text offset in pixels. A positive will shift the text down.
 * @property {boolean} [overflow=false] For polygon labels or when `placement` is set to `'line'`, allow text to exceed
 * the width of the polygon at the label position or the length of the path that it follows.
 * @property {TextPlacement} [placement='point'] Text placement.
 * @property {number} [repeat] Repeat interval. When set, the text will be repeated at this interval, which specifies
 * the distance between two text anchors in pixels. Only available when `placement` is set to `'line'`. Overrides 'textAlign'.
 * @property {number|import("../size.js").Size} [scale] Scale.
 * @property {boolean} [rotateWithView=false] Whether to rotate the text with the view.
 * @property {boolean} [keepUpright=true] Whether the text can be rotated 180° to prevent being rendered upside down.
 * @property {number} [rotation=0] Rotation in radians (positive rotation clockwise).
 * @property {string|Array<string>} [text] Text content or rich text content. For plain text provide a string, which can
 * contain line breaks (`\n`). For rich text provide an array of text/font tuples. A tuple consists of the text to
 * render and the font to use (or `''` to use the text style's font). A line break has to be a separate tuple (i.e. `'\n', ''`).
 * **Example:** `['foo', 'bold 10px sans-serif', ' bar', 'italic 10px sans-serif', ' baz', '']` will yield "**foo** *bar* baz".
 * **Note:** Rich text is not supported for `placement: 'line'` or the immediate rendering API.
 * @property {CanvasTextAlign} [textAlign] Text alignment. Possible values: `'left'`, `'right'`, `'center'`, `'end'` or `'start'`.
 * Default is `'center'` for `placement: 'point'`. For `placement: 'line'`, the default is to let the renderer choose a
 * placement where `maxAngle` is not exceeded.
 * @property {TextJustify} [justify] Text justification within the text box.
 * If not set, text is justified towards the `textAlign` anchor.
 * Otherwise, use options `'left'`, `'center'`, or `'right'` to justify the text within the text box.
 * **Note:** `justify` is ignored for immediate rendering and also for `placement: 'line'`.
 * @property {CanvasTextBaseline} [textBaseline='middle'] Text base line. Possible values: `'bottom'`, `'top'`, `'middle'`, `'alphabetic'`,
 * `'hanging'`, `'ideographic'`.
 * @property {import("./Fill.js").default|null} [fill] Fill style. If none is provided, we'll use a dark fill-style (#333). Specify `null` for no fill.
 * @property {import("./Stroke.js").default} [stroke] Stroke style.
 * @property {import("./Fill.js").default} [backgroundFill] Fill style for the text background when `placement` is
 * `'point'`. Default is no fill.
 * @property {import("./Stroke.js").default} [backgroundStroke] Stroke style for the text background  when `placement`
 * is `'point'`. Default is no stroke.
 * @property {Array<number>} [padding=[0, 0, 0, 0]] Padding in pixels around the text for decluttering and background. The order of
 * values in the array is `[top, right, bottom, left]`.
 * @property {import('../style/Style.js').DeclutterMode} [declutterMode] Declutter mode: `declutter`, `obstacle`, `none`
 */
/**
 * @classdesc
 * Set text style for vector features.
 * @api
 */
declare class Text {
    /**
     * @param {Options} [options] Options.
     */
    constructor(options?: Options$E);
    /**
     * @private
     * @type {string|undefined}
     */
    private font_;
    /**
     * @private
     * @type {number|undefined}
     */
    private rotation_;
    /**
     * @private
     * @type {boolean|undefined}
     */
    private rotateWithView_;
    /**
     * @private
     * @type {boolean|undefined}
     */
    private keepUpright_;
    /**
     * @private
     * @type {number|import("../size.js").Size|undefined}
     */
    private scale_;
    /**
     * @private
     * @type {import("../size.js").Size}
     */
    private scaleArray_;
    /**
     * @private
     * @type {string|Array<string>|undefined}
     */
    private text_;
    /**
     * @private
     * @type {CanvasTextAlign|undefined}
     */
    private textAlign_;
    /**
     * @private
     * @type {TextJustify|undefined}
     */
    private justify_;
    /**
     * @private
     * @type {number|undefined}
     */
    private repeat_;
    /**
     * @private
     * @type {CanvasTextBaseline|undefined}
     */
    private textBaseline_;
    /**
     * @private
     * @type {import("./Fill.js").default|null}
     */
    private fill_;
    /**
     * @private
     * @type {number}
     */
    private maxAngle_;
    /**
     * @private
     * @type {TextPlacement}
     */
    private placement_;
    /**
     * @private
     * @type {boolean}
     */
    private overflow_;
    /**
     * @private
     * @type {import("./Stroke.js").default|null}
     */
    private stroke_;
    /**
     * @private
     * @type {number}
     */
    private offsetX_;
    /**
     * @private
     * @type {number}
     */
    private offsetY_;
    /**
     * @private
     * @type {import("./Fill.js").default|null}
     */
    private backgroundFill_;
    /**
     * @private
     * @type {import("./Stroke.js").default|null}
     */
    private backgroundStroke_;
    /**
     * @private
     * @type {Array<number>|null}
     */
    private padding_;
    /**
     * @private
     * @type {import('../style/Style.js').DeclutterMode}
     */
    private declutterMode_;
    /**
     * Clones the style.
     * @return {Text} The cloned style.
     * @api
     */
    clone(): Text;
    /**
     * Get the `overflow` configuration.
     * @return {boolean} Let text overflow the length of the path they follow.
     * @api
     */
    getOverflow(): boolean;
    /**
     * Get the font name.
     * @return {string|undefined} Font.
     * @api
     */
    getFont(): string | undefined;
    /**
     * Get the maximum angle between adjacent characters.
     * @return {number} Angle in radians.
     * @api
     */
    getMaxAngle(): number;
    /**
     * Get the label placement.
     * @return {TextPlacement} Text placement.
     * @api
     */
    getPlacement(): TextPlacement;
    /**
     * Get the repeat interval of the text.
     * @return {number|undefined} Repeat interval in pixels.
     * @api
     */
    getRepeat(): number | undefined;
    /**
     * Get the x-offset for the text.
     * @return {number} Horizontal text offset.
     * @api
     */
    getOffsetX(): number;
    /**
     * Get the y-offset for the text.
     * @return {number} Vertical text offset.
     * @api
     */
    getOffsetY(): number;
    /**
     * Get the fill style for the text.
     * @return {import("./Fill.js").default|null} Fill style.
     * @api
     */
    getFill(): Fill | null;
    /**
     * Determine whether the text rotates with the map.
     * @return {boolean|undefined} Rotate with map.
     * @api
     */
    getRotateWithView(): boolean | undefined;
    /**
     * Determine whether the text can be rendered upside down.
     * @return {boolean|undefined} Keep text upright.
     * @api
     */
    getKeepUpright(): boolean | undefined;
    /**
     * Get the text rotation.
     * @return {number|undefined} Rotation.
     * @api
     */
    getRotation(): number | undefined;
    /**
     * Get the text scale.
     * @return {number|import("../size.js").Size|undefined} Scale.
     * @api
     */
    getScale(): number | Size | undefined;
    /**
     * Get the symbolizer scale array.
     * @return {import("../size.js").Size} Scale array.
     */
    getScaleArray(): Size;
    /**
     * Get the stroke style for the text.
     * @return {import("./Stroke.js").default|null} Stroke style.
     * @api
     */
    getStroke(): Stroke | null;
    /**
     * Get the text to be rendered.
     * @return {string|Array<string>|undefined} Text.
     * @api
     */
    getText(): string | Array<string> | undefined;
    /**
     * Get the text alignment.
     * @return {CanvasTextAlign|undefined} Text align.
     * @api
     */
    getTextAlign(): CanvasTextAlign | undefined;
    /**
     * Get the justification.
     * @return {TextJustify|undefined} Justification.
     * @api
     */
    getJustify(): TextJustify | undefined;
    /**
     * Get the text baseline.
     * @return {CanvasTextBaseline|undefined} Text baseline.
     * @api
     */
    getTextBaseline(): CanvasTextBaseline | undefined;
    /**
     * Get the background fill style for the text.
     * @return {import("./Fill.js").default|null} Fill style.
     * @api
     */
    getBackgroundFill(): Fill | null;
    /**
     * Get the background stroke style for the text.
     * @return {import("./Stroke.js").default|null} Stroke style.
     * @api
     */
    getBackgroundStroke(): Stroke | null;
    /**
     * Get the padding for the text.
     * @return {Array<number>|null} Padding.
     * @api
     */
    getPadding(): Array<number> | null;
    /**
     * Get the declutter mode of the shape
     * @return {import("./Style.js").DeclutterMode} Shape's declutter mode
     * @api
     */
    getDeclutterMode(): DeclutterMode;
    /**
     * Set the `overflow` property.
     *
     * @param {boolean} overflow Let text overflow the path that it follows.
     * @api
     */
    setOverflow(overflow: boolean): void;
    /**
     * Set the font.
     *
     * @param {string|undefined} font Font.
     * @api
     */
    setFont(font: string | undefined): void;
    /**
     * Set the maximum angle between adjacent characters.
     *
     * @param {number} maxAngle Angle in radians.
     * @api
     */
    setMaxAngle(maxAngle: number): void;
    /**
     * Set the x offset.
     *
     * @param {number} offsetX Horizontal text offset.
     * @api
     */
    setOffsetX(offsetX: number): void;
    /**
     * Set the y offset.
     *
     * @param {number} offsetY Vertical text offset.
     * @api
     */
    setOffsetY(offsetY: number): void;
    /**
     * Set the text placement.
     *
     * @param {TextPlacement} placement Placement.
     * @api
     */
    setPlacement(placement: TextPlacement): void;
    /**
     * Set the repeat interval of the text.
     * @param {number|undefined} [repeat] Repeat interval in pixels.
     * @api
     */
    setRepeat(repeat?: number | undefined): void;
    /**
     * Set whether to rotate the text with the view.
     *
     * @param {boolean} rotateWithView Rotate with map.
     * @api
     */
    setRotateWithView(rotateWithView: boolean): void;
    /**
     * Set whether the text can be rendered upside down.
     *
     * @param {boolean} keepUpright Keep text upright.
     * @api
     */
    setKeepUpright(keepUpright: boolean): void;
    /**
     * Set the fill.
     *
     * @param {import("./Fill.js").default|null} fill Fill style.
     * @api
     */
    setFill(fill: Fill | null): void;
    /**
     * Set the rotation.
     *
     * @param {number|undefined} rotation Rotation.
     * @api
     */
    setRotation(rotation: number | undefined): void;
    /**
     * Set the scale.
     *
     * @param {number|import("../size.js").Size|undefined} scale Scale.
     * @api
     */
    setScale(scale: number | Size | undefined): void;
    /**
     * Set the stroke.
     *
     * @param {import("./Stroke.js").default|null} stroke Stroke style.
     * @api
     */
    setStroke(stroke: Stroke | null): void;
    /**
     * Set the text.
     *
     * @param {string|Array<string>|undefined} text Text.
     * @api
     */
    setText(text: string | Array<string> | undefined): void;
    /**
     * Set the text alignment.
     *
     * @param {CanvasTextAlign|undefined} textAlign Text align.
     * @api
     */
    setTextAlign(textAlign: CanvasTextAlign | undefined): void;
    /**
     * Set the justification.
     *
     * @param {TextJustify|undefined} justify Justification.
     * @api
     */
    setJustify(justify: TextJustify | undefined): void;
    /**
     * Set the text baseline.
     *
     * @param {CanvasTextBaseline|undefined} textBaseline Text baseline.
     * @api
     */
    setTextBaseline(textBaseline: CanvasTextBaseline | undefined): void;
    /**
     * Set the background fill.
     *
     * @param {import("./Fill.js").default|null} fill Fill style.
     * @api
     */
    setBackgroundFill(fill: Fill | null): void;
    /**
     * Set the background stroke.
     *
     * @param {import("./Stroke.js").default|null} stroke Stroke style.
     * @api
     */
    setBackgroundStroke(stroke: Stroke | null): void;
    /**
     * Set the padding (`[top, right, bottom, left]`).
     *
     * @param {Array<number>|null} padding Padding.
     * @api
     */
    setPadding(padding: Array<number> | null): void;
}

/**
 * A function that takes a {@link module :ol/Tile~Tile} for the tile and a
 * `{string}` for the url as arguments. The default is
 * ```js
 * source.setTileLoadFunction(function(tile, src) {
 *   tile.getImage().src = src;
 * });
 * ```
 * For more fine grained control, the load function can use fetch or XMLHttpRequest and involve
 * error handling:
 *
 * ```js
 * import TileState from 'ol/TileState.js';
 *
 * source.setTileLoadFunction(function(tile, src) {
 *   const xhr = new XMLHttpRequest();
 *   xhr.responseType = 'blob';
 *   xhr.addEventListener('loadend', function (evt) {
 *     const data = this.response;
 *     if (data !== undefined) {
 *       tile.getImage().src = URL.createObjectURL(data);
 *     } else {
 *       tile.setState(TileState.ERROR);
 *     }
 *   });
 *   xhr.addEventListener('error', function () {
 *     tile.setState(TileState.ERROR);
 *   });
 *   xhr.open('GET', src);
 *   xhr.send();
 * });
 * ```
 */
type LoadFunction = (arg0: Tile, arg1: string) => void;
/**
 * {@link module :ol/source/Tile~TileSource} sources use a function of this type to get
 * the url that provides a tile for a given tile coordinate.
 *
 * This function takes a {@link module :ol/tilecoord~TileCoord} for the tile
 * coordinate, a `{number}` representing the pixel ratio and a
 * {@link module :ol/proj/Projection~Projection} for the projection  as arguments
 * and returns a `{string}` representing the tile URL, or undefined if no tile
 * should be requested for the passed tile coordinate.
 */
type UrlFunction = (arg0: TileCoord, arg1: number, arg2: Projection) => (string | undefined);
type Options$D = {
    /**
     * A duration for tile opacity
     * transitions in milliseconds. A duration of 0 disables the opacity transition.
     */
    transition?: number | undefined;
    /**
     * Use interpolated values when resampling.  By default,
     * the nearest neighbor is used when resampling.
     */
    interpolate?: boolean | undefined;
};
/**
 * A function that takes a {@link module:ol/Tile~Tile} for the tile and a
 * `{string}` for the url as arguments. The default is
 * ```js
 * source.setTileLoadFunction(function(tile, src) {
 *   tile.getImage().src = src;
 * });
 * ```
 * For more fine grained control, the load function can use fetch or XMLHttpRequest and involve
 * error handling:
 *
 * ```js
 * import TileState from 'ol/TileState.js';
 *
 * source.setTileLoadFunction(function(tile, src) {
 *   const xhr = new XMLHttpRequest();
 *   xhr.responseType = 'blob';
 *   xhr.addEventListener('loadend', function (evt) {
 *     const data = this.response;
 *     if (data !== undefined) {
 *       tile.getImage().src = URL.createObjectURL(data);
 *     } else {
 *       tile.setState(TileState.ERROR);
 *     }
 *   });
 *   xhr.addEventListener('error', function () {
 *     tile.setState(TileState.ERROR);
 *   });
 *   xhr.open('GET', src);
 *   xhr.send();
 * });
 * ```
 *
 * @typedef {function(Tile, string): void} LoadFunction
 * @api
 */
/**
 * {@link module:ol/source/Tile~TileSource} sources use a function of this type to get
 * the url that provides a tile for a given tile coordinate.
 *
 * This function takes a {@link module:ol/tilecoord~TileCoord} for the tile
 * coordinate, a `{number}` representing the pixel ratio and a
 * {@link module:ol/proj/Projection~Projection} for the projection  as arguments
 * and returns a `{string}` representing the tile URL, or undefined if no tile
 * should be requested for the passed tile coordinate.
 *
 * @typedef {function(import("./tilecoord.js").TileCoord, number,
 *           import("./proj/Projection.js").default): (string|undefined)} UrlFunction
 * @api
 */
/**
 * @typedef {Object} Options
 * @property {number} [transition=250] A duration for tile opacity
 * transitions in milliseconds. A duration of 0 disables the opacity transition.
 * @property {boolean} [interpolate=false] Use interpolated values when resampling.  By default,
 * the nearest neighbor is used when resampling.
 * @api
 */
/**
 * @classdesc
 * Base class for tiles.
 *
 * @abstract
 */
declare class Tile extends Target {
    /**
     * @param {import("./tilecoord.js").TileCoord} tileCoord Tile coordinate.
     * @param {import("./TileState.js").default} state State.
     * @param {Options} [options] Tile options.
     */
    constructor(tileCoord: TileCoord, state: any, options?: Options$D);
    /**
     * @type {import("./tilecoord.js").TileCoord}
     */
    tileCoord: TileCoord;
    /**
     * @protected
     * @type {import("./TileState.js").default}
     */
    protected state: any;
    /**
     * A key assigned to the tile. This is used in conjunction with a source key
     * to determine if a cached version of this tile may be used by the renderer.
     * @type {string}
     */
    key: string;
    /**
     * The duration for the opacity transition.
     * @private
     * @type {number}
     */
    private transition_;
    /**
     * Lookup of start times for rendering transitions.  If the start time is
     * equal to -1, the transition is complete.
     * @private
     * @type {Object<string, number>}
     */
    private transitionStarts_;
    /**
     * @type {boolean}
     */
    interpolate: boolean;
    /**
     * @protected
     */
    protected changed(): void;
    /**
     * Called by the tile cache when the tile is removed from the cache due to expiry
     */
    release(): void;
    /**
     * @return {string} Key.
     */
    getKey(): string;
    /**
     * Get the tile coordinate for this tile.
     * @return {import("./tilecoord.js").TileCoord} The tile coordinate.
     * @api
     */
    getTileCoord(): TileCoord;
    /**
     * @return {import("./TileState.js").default} State.
     */
    getState(): any;
    /**
     * Sets the state of this tile. If you write your own {@link module:ol/Tile~LoadFunction tileLoadFunction} ,
     * it is important to set the state correctly to {@link module:ol/TileState~ERROR}
     * when the tile cannot be loaded. Otherwise the tile cannot be removed from
     * the tile queue and will block other requests.
     * @param {import("./TileState.js").default} state State.
     * @api
     */
    setState(state: any): void;
    /**
     * Load the image or retry if loading previously failed.
     * Loading is taken care of by the tile queue, and calling this method is
     * only needed for preloading or for reloading in case of an error.
     * @abstract
     * @api
     */
    load(): void;
    /**
     * Get the alpha value for rendering.
     * @param {string} id An id for the renderer.
     * @param {number} time The render frame time.
     * @return {number} A number between 0 and 1.
     */
    getAlpha(id: string, time: number): number;
    /**
     * Determine if a tile is in an alpha transition.  A tile is considered in
     * transition if tile.getAlpha() has not yet been called or has been called
     * and returned 1.
     * @param {string} id An id for the renderer.
     * @return {boolean} The tile is in transition.
     */
    inTransition(id: string): boolean;
    /**
     * Mark a transition as complete.
     * @param {string} id An id for the renderer.
     */
    endTransition(id: string): void;
}

type ImageLike = HTMLImageElement | HTMLCanvasElement | OffscreenCanvas | HTMLVideoElement | ImageBitmap;
type ArrayLike = Uint8Array | Uint8ClampedArray | Float32Array | DataView;
/**
 * Data that can be used with a DataTile.
 */
type Data = ArrayLike | ImageLike;
type Options$C = {
    /**
     * Tile coordinate.
     */
    tileCoord: TileCoord;
    /**
     * Data loader.  For loaders that generate images,
     * the promise should not resolve until the image is loaded.
     */
    loader: () => Promise<Data>;
    /**
     * A duration for tile opacity
     * transitions in milliseconds. A duration of 0 disables the opacity transition.
     */
    transition?: number | undefined;
    /**
     * Use interpolated values when resampling.  By default,
     * the nearest neighbor is used when resampling.
     */
    interpolate?: boolean | undefined;
    /**
     * Tile size.
     */
    size?: Size | undefined;
    /**
     * An abort controller.
     */
    controller?: AbortController | undefined;
};
/**
 * @typedef {Object} Options
 * @property {import("./tilecoord.js").TileCoord} tileCoord Tile coordinate.
 * @property {function(): Promise<Data>} loader Data loader.  For loaders that generate images,
 * the promise should not resolve until the image is loaded.
 * @property {number} [transition=250] A duration for tile opacity
 * transitions in milliseconds. A duration of 0 disables the opacity transition.
 * @property {boolean} [interpolate=false] Use interpolated values when resampling.  By default,
 * the nearest neighbor is used when resampling.
 * @property {import('./size.js').Size} [size=[256, 256]] Tile size.
 * @property {AbortController} [controller] An abort controller.
 * @api
 */
declare class DataTile extends Tile {
    /**
     * @param {Options} options Tile options.
     */
    constructor(options: Options$C);
    /**
     * @type {function(): Promise<Data>}
     * @private
     */
    private loader_;
    /**
     * @type {Data}
     * @private
     */
    private data_;
    /**
     * @type {Error}
     * @private
     */
    private error_;
    /**
     * @type {import('./size.js').Size|null}
     * @private
     */
    private size_;
    /**
     * @type {AbortController|null}
     * @private
     */
    private controller_;
    /**
     * Get the tile size.
     * @return {import('./size.js').Size} Tile size.
     */
    getSize(): Size;
    /**
     * Get the data for the tile.
     * @return {Data} Tile data.
     * @api
     */
    getData(): Data;
    /**
     * Get any loading error.
     * @return {Error} Loading error.
     * @api
     */
    getError(): Error;
}

type Options$B = {
    /**
     * Opacity.
     */
    opacity: number;
    /**
     * If the image should get rotated with the view.
     */
    rotateWithView: boolean;
    /**
     * Rotation.
     */
    rotation: number;
    /**
     * Scale.
     */
    scale: number | Size;
    /**
     * Displacement.
     */
    displacement: Array<number>;
    /**
     * Declutter mode: `declutter`, `obstacle`, `none`.
     */
    declutterMode: DeclutterMode;
};
/**
 * @typedef {Object} Options
 * @property {number} opacity Opacity.
 * @property {boolean} rotateWithView If the image should get rotated with the view.
 * @property {number} rotation Rotation.
 * @property {number|import("../size.js").Size} scale Scale.
 * @property {Array<number>} displacement Displacement.
 * @property {import('../style/Style.js').DeclutterMode} declutterMode Declutter mode: `declutter`, `obstacle`, `none`.
 */
/**
 * @classdesc
 * A base class used for creating subclasses and not instantiated in
 * apps. Base class for {@link module:ol/style/Icon~Icon}, {@link module:ol/style/Circle~CircleStyle} and
 * {@link module:ol/style/RegularShape~RegularShape}.
 * @abstract
 * @api
 */
declare class ImageStyle {
    /**
     * @param {Options} options Options.
     */
    constructor(options: Options$B);
    /**
     * @private
     * @type {number}
     */
    private opacity_;
    /**
     * @private
     * @type {boolean}
     */
    private rotateWithView_;
    /**
     * @private
     * @type {number}
     */
    private rotation_;
    /**
     * @private
     * @type {number|import("../size.js").Size}
     */
    private scale_;
    /**
     * @private
     * @type {import("../size.js").Size}
     */
    private scaleArray_;
    /**
     * @private
     * @type {Array<number>}
     */
    private displacement_;
    /**
     * @private
     * @type {import('../style/Style.js').DeclutterMode}
     */
    private declutterMode_;
    /**
     * Clones the style.
     * @return {ImageStyle} The cloned style.
     * @api
     */
    clone(): ImageStyle;
    /**
     * Get the symbolizer opacity.
     * @return {number} Opacity.
     * @api
     */
    getOpacity(): number;
    /**
     * Determine whether the symbolizer rotates with the map.
     * @return {boolean} Rotate with map.
     * @api
     */
    getRotateWithView(): boolean;
    /**
     * Get the symoblizer rotation.
     * @return {number} Rotation.
     * @api
     */
    getRotation(): number;
    /**
     * Get the symbolizer scale.
     * @return {number|import("../size.js").Size} Scale.
     * @api
     */
    getScale(): number | Size;
    /**
     * Get the symbolizer scale array.
     * @return {import("../size.js").Size} Scale array.
     */
    getScaleArray(): Size;
    /**
     * Get the displacement of the shape
     * @return {Array<number>} Shape's center displacement
     * @api
     */
    getDisplacement(): Array<number>;
    /**
     * Get the declutter mode of the shape
     * @return {import("./Style.js").DeclutterMode} Shape's declutter mode
     * @api
     */
    getDeclutterMode(): DeclutterMode;
    /**
     * Get the anchor point in pixels. The anchor determines the center point for the
     * symbolizer.
     * @abstract
     * @return {Array<number>} Anchor.
     */
    getAnchor(): Array<number>;
    /**
     * Get the image element for the symbolizer.
     * @abstract
     * @param {number} pixelRatio Pixel ratio.
     * @return {import('../DataTile.js').ImageLike} Image element.
     */
    getImage(pixelRatio: number): ImageLike;
    /**
     * @abstract
     * @return {import('../DataTile.js').ImageLike} Image element.
     */
    getHitDetectionImage(): ImageLike;
    /**
     * Get the image pixel ratio.
     * @param {number} pixelRatio Pixel ratio.
     * @return {number} Pixel ratio.
     */
    getPixelRatio(pixelRatio: number): number;
    /**
     * @abstract
     * @return {import("../ImageState.js").default} Image state.
     */
    getImageState(): any;
    /**
     * @abstract
     * @return {import("../size.js").Size} Image size.
     */
    getImageSize(): Size;
    /**
     * Get the origin of the symbolizer.
     * @abstract
     * @return {Array<number>} Origin.
     */
    getOrigin(): Array<number>;
    /**
     * Get the size of the symbolizer (in pixels).
     * @abstract
     * @return {import("../size.js").Size} Size.
     */
    getSize(): Size;
    /**
     * Set the displacement.
     *
     * @param {Array<number>} displacement Displacement.
     * @api
     */
    setDisplacement(displacement: Array<number>): void;
    /**
     * Set the opacity.
     *
     * @param {number} opacity Opacity.
     * @api
     */
    setOpacity(opacity: number): void;
    /**
     * Set whether to rotate the style with the view.
     *
     * @param {boolean} rotateWithView Rotate with map.
     * @api
     */
    setRotateWithView(rotateWithView: boolean): void;
    /**
     * Set the rotation.
     *
     * @param {number} rotation Rotation.
     * @api
     */
    setRotation(rotation: number): void;
    /**
     * Set the scale.
     *
     * @param {number|import("../size.js").Size} scale Scale.
     * @api
     */
    setScale(scale: number | Size): void;
    /**
     * @abstract
     * @param {function(import("../events/Event.js").default): void} listener Listener function.
     */
    listenImageChange(listener: (arg0: BaseEvent) => void): void;
    /**
     * Load not yet loaded URI.
     * @abstract
     */
    load(): void;
    /**
     * @abstract
     * @param {function(import("../events/Event.js").default): void} listener Listener function.
     */
    unlistenImageChange(listener: (arg0: BaseEvent) => void): void;
    /**
     * @return {Promise<void>} `false` or Promise that resolves when the style is ready to use.
     */
    ready(): Promise<void>;
}

type Entry<T> = rbush.BBox & {
    value: T;
};

type ZIndexContextProxy = CanvasRenderingContext2D | (OffscreenCanvasRenderingContext2D & {
    globalAlpha: any;
});
/** @typedef {CanvasRenderingContext2D|OffscreenCanvasRenderingContext2D & {globalAlpha: any}} ZIndexContextProxy */
/**
 * @extends {CanvasRenderingContext2D}
 */
declare class ZIndexContext {
    /**
     * @private
     * @type {Array<Array<*>>}
     */
    private instructions_;
    /**
     * @type {number}
     */
    zIndex: number;
    /**
     * @private
     * @type {number}
     */
    private offset_;
    /**
     * @private
     * @type {ZIndexContextProxy}
     */
    private context_;
    /**
     * @param {...*} args Arguments to push to the instructions array.
     * @private
     */
    private push_;
    /**
     * @private
     * @param {...*} args Args.
     * @return {ZIndexContext} This.
     */
    private pushMethodArgs_;
    /**
     * Push a function that renders to the context directly.
     * @param {function(CanvasRenderingContext2D): void} render Function.
     */
    pushFunction(render: (arg0: CanvasRenderingContext2D) => void): void;
    /**
     * Get a proxy for CanvasRenderingContext2D which does not support getting state
     * (e.g. `context.globalAlpha`, which will return `undefined`). To set state, if it relies on a
     * previous state (e.g. `context.globalAlpha = context.globalAlpha / 2`), set a function,
     * e.g. `context.globalAlpha = (context) => context.globalAlpha / 2`.
     * @return {ZIndexContextProxy} Context.
     */
    getContext(): ZIndexContextProxy;
    /**
     * @param {CanvasRenderingContext2D|OffscreenCanvasRenderingContext2D} context Context.
     */
    draw(context: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D): void;
    clear(): void;
    /**
     * Offsets the zIndex by the highest current zIndex. Useful for rendering multiple worlds or tiles, to
     * avoid conflicting context.clip() or context.save()/restore() calls.
     */
    offset(): void;
}

type DeclutterEntry = Entry<FeatureLike>;
type ImageOrLabelDimensions = {
    /**
     * DrawImageX.
     */
    drawImageX: number;
    /**
     * DrawImageY.
     */
    drawImageY: number;
    /**
     * DrawImageW.
     */
    drawImageW: number;
    /**
     * DrawImageH.
     */
    drawImageH: number;
    /**
     * OriginX.
     */
    originX: number;
    /**
     * OriginY.
     */
    originY: number;
    /**
     * Scale.
     */
    scale: Array<number>;
    /**
     * DeclutterBox.
     */
    declutterBox: DeclutterEntry;
    /**
     * CanvasTransform.
     */
    canvasTransform: Transform;
};
type ReplayImageOrLabelArgs = {
    0: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D;
    1: Size;
    2: Label | HTMLImageElement | HTMLCanvasElement | HTMLVideoElement;
    3: ImageOrLabelDimensions;
    4: number;
    5: Array<any>;
    6: Array<any>;
};

type BuilderType = "Circle" | "Image" | "LineString" | "Polygon" | "Text" | "Default";
type Label = {
    /**
     * Width.
     */
    width: number;
    /**
     * Height.
     */
    height: number;
    /**
     * ContextInstructions.
     */
    contextInstructions: Array<string | number>;
};
type DeclutterImageWithText = {
    [x: number]: ReplayImageOrLabelArgs;
};

/**
 * @classdesc
 * Linear ring geometry. Only used as part of polygon; cannot be rendered
 * on its own.
 *
 * @api
 */
declare class LinearRing extends SimpleGeometry {
    /**
     * @param {Array<import("../coordinate.js").Coordinate>|Array<number>} coordinates Coordinates.
     *     For internal use, flat coordinates in combination with `layout` are also accepted.
     * @param {import("./Geometry.js").GeometryLayout} [layout] Layout.
     */
    constructor(coordinates: Array<Coordinate> | Array<number>, layout?: GeometryLayout);
    /**
     * @private
     * @type {number}
     */
    private maxDelta_;
    /**
     * @private
     * @type {number}
     */
    private maxDeltaRevision_;
    /**
     * Make a complete copy of the geometry.
     * @return {!LinearRing} Clone.
     * @api
     * @override
     */
    override clone(): LinearRing;
    /**
     * Return the area of the linear ring on projected plane.
     * @return {number} Area (on projected plane).
     * @api
     */
    getArea(): number;
    /**
     * Return the coordinates of the linear ring.
     * @return {Array<import("../coordinate.js").Coordinate>} Coordinates.
     * @api
     * @override
     */
    override getCoordinates(): Array<Coordinate>;
    /**
     * @param {number} squaredTolerance Squared tolerance.
     * @return {LinearRing} Simplified LinearRing.
     * @protected
     * @override
     */
    protected override getSimplifiedGeometryInternal(squaredTolerance: number): LinearRing;
    /**
     * Set the coordinates of the linear ring.
     * @param {!Array<import("../coordinate.js").Coordinate>} coordinates Coordinates.
     * @param {import("./Geometry.js").GeometryLayout} [layout] Layout.
     * @api
     * @override
     */
    override setCoordinates(coordinates: Array<Coordinate>, layout?: GeometryLayout): void;
}
//# sourceMappingURL=LinearRing.d.ts.map

/**
 * @classdesc
 * Point geometry.
 *
 * @api
 */
declare class Point$1 extends SimpleGeometry {
    /**
     * @param {import("../coordinate.js").Coordinate} coordinates Coordinates.
     * @param {import("./Geometry.js").GeometryLayout} [layout] Layout.
     */
    constructor(coordinates: Coordinate, layout?: GeometryLayout);
    /**
     * Make a complete copy of the geometry.
     * @return {!Point} Clone.
     * @api
     * @override
     */
    override clone(): Point$1;
    /**
     * Return the coordinate of the point.
     * @return {import("../coordinate.js").Coordinate} Coordinates.
     * @api
     * @override
     */
    override getCoordinates(): Coordinate;
}
//# sourceMappingURL=Point.d.ts.map

/**
 * @classdesc
 * Polygon geometry.
 *
 * @api
 */
declare class Polygon extends SimpleGeometry {
    /**
     * @param {!Array<Array<import("../coordinate.js").Coordinate>>|!Array<number>} coordinates
     *     Array of linear rings that define the polygon. The first linear ring of the
     *     array defines the outer-boundary or surface of the polygon. Each subsequent
     *     linear ring defines a hole in the surface of the polygon. A linear ring is
     *     an array of vertices' coordinates where the first coordinate and the last are
     *     equivalent. (For internal use, flat coordinates in combination with
     *     `layout` and `ends` are also accepted.)
     * @param {import("./Geometry.js").GeometryLayout} [layout] Layout.
     * @param {Array<number>} [ends] Ends (for internal use with flat coordinates).
     */
    constructor(coordinates: Array<Array<Coordinate>> | Array<number>, layout?: GeometryLayout, ends?: Array<number>);
    /**
     * @type {Array<number>}
     * @private
     */
    private ends_;
    /**
     * @private
     * @type {number}
     */
    private flatInteriorPointRevision_;
    /**
     * @private
     * @type {import("../coordinate.js").Coordinate|null}
     */
    private flatInteriorPoint_;
    /**
     * @private
     * @type {number}
     */
    private maxDelta_;
    /**
     * @private
     * @type {number}
     */
    private maxDeltaRevision_;
    /**
     * @private
     * @type {number}
     */
    private orientedRevision_;
    /**
     * @private
     * @type {Array<number>|null}
     */
    private orientedFlatCoordinates_;
    /**
     * Append the passed linear ring to this polygon.
     * @param {LinearRing} linearRing Linear ring.
     * @api
     */
    appendLinearRing(linearRing: LinearRing): void;
    /**
     * Make a complete copy of the geometry.
     * @return {!Polygon} Clone.
     * @api
     * @override
     */
    override clone(): Polygon;
    /**
     * Return the area of the polygon on projected plane.
     * @return {number} Area (on projected plane).
     * @api
     */
    getArea(): number;
    /**
     * Get the coordinate array for this geometry.  This array has the structure
     * of a GeoJSON coordinate array for polygons.
     *
     * @param {boolean} [right] Orient coordinates according to the right-hand
     *     rule (counter-clockwise for exterior and clockwise for interior rings).
     *     If `false`, coordinates will be oriented according to the left-hand rule
     *     (clockwise for exterior and counter-clockwise for interior rings).
     *     By default, coordinate orientation will depend on how the geometry was
     *     constructed.
     * @return {Array<Array<import("../coordinate.js").Coordinate>>} Coordinates.
     * @api
     * @override
     */
    override getCoordinates(right?: boolean): Array<Array<Coordinate>>;
    /**
     * @return {Array<number>} Ends.
     */
    getEnds(): Array<number>;
    /**
     * @return {Array<number>} Interior point.
     */
    getFlatInteriorPoint(): Array<number>;
    /**
     * Return an interior point of the polygon.
     * @return {Point} Interior point as XYM coordinate, where M is the
     * length of the horizontal intersection that the point belongs to.
     * @api
     */
    getInteriorPoint(): Point$1;
    /**
     * Return the number of rings of the polygon,  this includes the exterior
     * ring and any interior rings.
     *
     * @return {number} Number of rings.
     * @api
     */
    getLinearRingCount(): number;
    /**
     * Return the Nth linear ring of the polygon geometry. Return `null` if the
     * given index is out of range.
     * The exterior linear ring is available at index `0` and the interior rings
     * at index `1` and beyond.
     *
     * @param {number} index Index.
     * @return {LinearRing|null} Linear ring.
     * @api
     */
    getLinearRing(index: number): LinearRing | null;
    /**
     * Return the linear rings of the polygon.
     * @return {Array<LinearRing>} Linear rings.
     * @api
     */
    getLinearRings(): Array<LinearRing>;
    /**
     * @return {Array<number>} Oriented flat coordinates.
     */
    getOrientedFlatCoordinates(): Array<number>;
    /**
     * @param {number} squaredTolerance Squared tolerance.
     * @return {Polygon} Simplified Polygon.
     * @protected
     * @override
     */
    protected override getSimplifiedGeometryInternal(squaredTolerance: number): Polygon;
    /**
     * Set the coordinates of the polygon.
     * @param {!Array<Array<import("../coordinate.js").Coordinate>>} coordinates Coordinates.
     * @param {import("./Geometry.js").GeometryLayout} [layout] Layout.
     * @api
     * @override
     */
    override setCoordinates(coordinates: Array<Array<Coordinate>>, layout?: GeometryLayout): void;
}

/**
 * @classdesc
 * Multi-point geometry.
 *
 * @api
 */
declare class MultiPoint extends SimpleGeometry {
    /**
     * @param {Array<import("../coordinate.js").Coordinate>|Array<number>} coordinates Coordinates.
     *     For internal use, flat coordinates in combination with `layout` are also accepted.
     * @param {import("./Geometry.js").GeometryLayout} [layout] Layout.
     */
    constructor(coordinates: Array<Coordinate> | Array<number>, layout?: GeometryLayout);
    /**
     * Append the passed point to this multipoint.
     * @param {Point} point Point.
     * @api
     */
    appendPoint(point: Point$1): void;
    /**
     * Make a complete copy of the geometry.
     * @return {!MultiPoint} Clone.
     * @api
     * @override
     */
    override clone(): MultiPoint;
    /**
     * Return the coordinates of the multipoint.
     * @return {Array<import("../coordinate.js").Coordinate>} Coordinates.
     * @api
     * @override
     */
    override getCoordinates(): Array<Coordinate>;
    /**
     * Return the point at the specified index.
     * @param {number} index Index.
     * @return {Point} Point.
     * @api
     */
    getPoint(index: number): Point$1;
    /**
     * Return the points of this multipoint.
     * @return {Array<Point>} Points.
     * @api
     */
    getPoints(): Array<Point$1>;
    /**
     * Set the coordinates of the multipoint.
     * @param {!Array<import("../coordinate.js").Coordinate>} coordinates Coordinates.
     * @param {import("./Geometry.js").GeometryLayout} [layout] Layout.
     * @api
     * @override
     */
    override setCoordinates(coordinates: Array<Coordinate>, layout?: GeometryLayout): void;
}
//# sourceMappingURL=MultiPoint.d.ts.map

/**
 * @classdesc
 * Multi-polygon geometry.
 *
 * @api
 */
declare class MultiPolygon extends SimpleGeometry {
    /**
     * @param {Array<Array<Array<import("../coordinate.js").Coordinate>>|Polygon>|Array<number>} coordinates Coordinates.
     *     For internal use, flat coordinates in combination with `layout` and `endss` are also accepted.
     * @param {import("./Geometry.js").GeometryLayout} [layout] Layout.
     * @param {Array<Array<number>>} [endss] Array of ends for internal use with flat coordinates.
     */
    constructor(coordinates: Array<Array<Array<Coordinate>> | Polygon> | Array<number>, layout?: GeometryLayout, endss?: Array<Array<number>>);
    /**
     * @type {Array<Array<number>>}
     * @private
     */
    private endss_;
    /**
     * @private
     * @type {number}
     */
    private flatInteriorPointsRevision_;
    /**
     * @private
     * @type {Array<number>|null}
     */
    private flatInteriorPoints_;
    /**
     * @private
     * @type {number}
     */
    private maxDelta_;
    /**
     * @private
     * @type {number}
     */
    private maxDeltaRevision_;
    /**
     * @private
     * @type {number}
     */
    private orientedRevision_;
    /**
     * @private
     * @type {Array<number>|null}
     */
    private orientedFlatCoordinates_;
    /**
     * Append the passed polygon to this multipolygon.
     * @param {Polygon} polygon Polygon.
     * @api
     */
    appendPolygon(polygon: Polygon): void;
    /**
     * Make a complete copy of the geometry.
     * @return {!MultiPolygon} Clone.
     * @api
     * @override
     */
    override clone(): MultiPolygon;
    /**
     * Return the area of the multipolygon on projected plane.
     * @return {number} Area (on projected plane).
     * @api
     */
    getArea(): number;
    /**
     * Get the coordinate array for this geometry.  This array has the structure
     * of a GeoJSON coordinate array for multi-polygons.
     *
     * @param {boolean} [right] Orient coordinates according to the right-hand
     *     rule (counter-clockwise for exterior and clockwise for interior rings).
     *     If `false`, coordinates will be oriented according to the left-hand rule
     *     (clockwise for exterior and counter-clockwise for interior rings).
     *     By default, coordinate orientation will depend on how the geometry was
     *     constructed.
     * @return {Array<Array<Array<import("../coordinate.js").Coordinate>>>} Coordinates.
     * @api
     * @override
     */
    override getCoordinates(right?: boolean): Array<Array<Array<Coordinate>>>;
    /**
     * @return {Array<Array<number>>} Endss.
     */
    getEndss(): Array<Array<number>>;
    /**
     * @return {Array<number>} Flat interior points.
     */
    getFlatInteriorPoints(): Array<number>;
    /**
     * Return the interior points as {@link module:ol/geom/MultiPoint~MultiPoint multipoint}.
     * @return {MultiPoint} Interior points as XYM coordinates, where M is
     * the length of the horizontal intersection that the point belongs to.
     * @api
     */
    getInteriorPoints(): MultiPoint;
    /**
     * @return {Array<number>} Oriented flat coordinates.
     */
    getOrientedFlatCoordinates(): Array<number>;
    /**
     * @param {number} squaredTolerance Squared tolerance.
     * @return {MultiPolygon} Simplified MultiPolygon.
     * @protected
     * @override
     */
    protected override getSimplifiedGeometryInternal(squaredTolerance: number): MultiPolygon;
    /**
     * Return the polygon at the specified index.
     * @param {number} index Index.
     * @return {Polygon} Polygon.
     * @api
     */
    getPolygon(index: number): Polygon;
    /**
     * Return the polygons of this multipolygon.
     * @return {Array<Polygon>} Polygons.
     * @api
     */
    getPolygons(): Array<Polygon>;
    /**
     * Set the coordinates of the multipolygon.
     * @param {!Array<Array<Array<import("../coordinate.js").Coordinate>>>} coordinates Coordinates.
     * @param {import("./Geometry.js").GeometryLayout} [layout] Layout.
     * @api
     * @override
     */
    override setCoordinates(coordinates: Array<Array<Array<Coordinate>>>, layout?: GeometryLayout): void;
}
//# sourceMappingURL=MultiPolygon.d.ts.map

/**
 * @classdesc
 * Linestring geometry.
 *
 * @api
 */
declare class LineString extends SimpleGeometry {
    /**
     * @param {Array<import("../coordinate.js").Coordinate>|Array<number>} coordinates Coordinates.
     *     For internal use, flat coordinates in combination with `layout` are also accepted.
     * @param {import("./Geometry.js").GeometryLayout} [layout] Layout.
     */
    constructor(coordinates: Array<Coordinate> | Array<number>, layout?: GeometryLayout);
    /**
     * @private
     * @type {import("../coordinate.js").Coordinate|null}
     */
    private flatMidpoint_;
    /**
     * @private
     * @type {number}
     */
    private flatMidpointRevision_;
    /**
     * @private
     * @type {number}
     */
    private maxDelta_;
    /**
     * @private
     * @type {number}
     */
    private maxDeltaRevision_;
    /**
     * Append the passed coordinate to the coordinates of the linestring.
     * @param {import("../coordinate.js").Coordinate} coordinate Coordinate.
     * @api
     */
    appendCoordinate(coordinate: Coordinate): void;
    /**
     * Make a complete copy of the geometry.
     * @return {!LineString} Clone.
     * @api
     * @override
     */
    override clone(): LineString;
    /**
     * Iterate over each segment, calling the provided callback.
     * If the callback returns a truthy value the function returns that
     * value immediately. Otherwise the function returns `false`.
     *
     * @param {function(this: S, import("../coordinate.js").Coordinate, import("../coordinate.js").Coordinate): T} callback Function
     *     called for each segment. The function will receive two arguments, the start and end coordinates of the segment.
     * @return {T|boolean} Value.
     * @template T,S
     * @api
     */
    forEachSegment<T, S>(callback: (this: S, arg1: Coordinate, arg2: Coordinate) => T): T | boolean;
    /**
     * Returns the coordinate at `m` using linear interpolation, or `null` if no
     * such coordinate exists.
     *
     * `extrapolate` controls extrapolation beyond the range of Ms in the
     * MultiLineString. If `extrapolate` is `true` then Ms less than the first
     * M will return the first coordinate and Ms greater than the last M will
     * return the last coordinate.
     *
     * @param {number} m M.
     * @param {boolean} [extrapolate] Extrapolate. Default is `false`.
     * @return {import("../coordinate.js").Coordinate|null} Coordinate.
     * @api
     */
    getCoordinateAtM(m: number, extrapolate?: boolean): Coordinate | null;
    /**
     * Return the coordinates of the linestring.
     * @return {Array<import("../coordinate.js").Coordinate>} Coordinates.
     * @api
     * @override
     */
    override getCoordinates(): Array<Coordinate>;
    /**
     * Return the coordinate at the provided fraction along the linestring.
     * The `fraction` is a number between 0 and 1, where 0 is the start of the
     * linestring and 1 is the end.
     * @param {number} fraction Fraction.
     * @param {import("../coordinate.js").Coordinate} [dest] Optional coordinate whose values will
     *     be modified. If not provided, a new coordinate will be returned.
     * @return {import("../coordinate.js").Coordinate} Coordinate of the interpolated point.
     * @api
     */
    getCoordinateAt(fraction: number, dest?: Coordinate): Coordinate;
    /**
     * Return the length of the linestring on projected plane.
     * @return {number} Length (on projected plane).
     * @api
     */
    getLength(): number;
    /**
     * @return {Array<number>} Flat midpoint.
     */
    getFlatMidpoint(): Array<number>;
    /**
     * @param {number} squaredTolerance Squared tolerance.
     * @return {LineString} Simplified LineString.
     * @protected
     * @override
     */
    protected override getSimplifiedGeometryInternal(squaredTolerance: number): LineString;
    /**
     * Set the coordinates of the linestring.
     * @param {!Array<import("../coordinate.js").Coordinate>} coordinates Coordinates.
     * @param {import("./Geometry.js").GeometryLayout} [layout] Layout.
     * @api
     * @override
     */
    override setCoordinates(coordinates: Array<Coordinate>, layout?: GeometryLayout): void;
}
//# sourceMappingURL=LineString.d.ts.map

/**
 * @classdesc
 * Multi-linestring geometry.
 *
 * @api
 */
declare class MultiLineString extends SimpleGeometry {
    /**
     * @param {Array<Array<import("../coordinate.js").Coordinate>|LineString>|Array<number>} coordinates
     *     Coordinates or LineString geometries. (For internal use, flat coordinates in
     *     combination with `layout` and `ends` are also accepted.)
     * @param {import("./Geometry.js").GeometryLayout} [layout] Layout.
     * @param {Array<number>} [ends] Flat coordinate ends for internal use.
     */
    constructor(coordinates: Array<Array<Coordinate> | LineString> | Array<number>, layout?: GeometryLayout, ends?: Array<number>);
    /**
     * @type {Array<number>}
     * @private
     */
    private ends_;
    /**
     * @private
     * @type {number}
     */
    private maxDelta_;
    /**
     * @private
     * @type {number}
     */
    private maxDeltaRevision_;
    /**
     * Append the passed linestring to the multilinestring.
     * @param {LineString} lineString LineString.
     * @api
     */
    appendLineString(lineString: LineString): void;
    /**
     * Make a complete copy of the geometry.
     * @return {!MultiLineString} Clone.
     * @api
     * @override
     */
    override clone(): MultiLineString;
    /**
     * Returns the coordinate at `m` using linear interpolation, or `null` if no
     * such coordinate exists.
     *
     * `extrapolate` controls extrapolation beyond the range of Ms in the
     * MultiLineString. If `extrapolate` is `true` then Ms less than the first
     * M will return the first coordinate and Ms greater than the last M will
     * return the last coordinate.
     *
     * `interpolate` controls interpolation between consecutive LineStrings
     * within the MultiLineString. If `interpolate` is `true` the coordinates
     * will be linearly interpolated between the last coordinate of one LineString
     * and the first coordinate of the next LineString.  If `interpolate` is
     * `false` then the function will return `null` for Ms falling between
     * LineStrings.
     *
     * @param {number} m M.
     * @param {boolean} [extrapolate] Extrapolate. Default is `false`.
     * @param {boolean} [interpolate] Interpolate. Default is `false`.
     * @return {import("../coordinate.js").Coordinate|null} Coordinate.
     * @api
     */
    getCoordinateAtM(m: number, extrapolate?: boolean, interpolate?: boolean): Coordinate | null;
    /**
     * Return the coordinates of the multilinestring.
     * @return {Array<Array<import("../coordinate.js").Coordinate>>} Coordinates.
     * @api
     * @override
     */
    override getCoordinates(): Array<Array<Coordinate>>;
    /**
     * @return {Array<number>} Ends.
     */
    getEnds(): Array<number>;
    /**
     * Return the linestring at the specified index.
     * @param {number} index Index.
     * @return {LineString} LineString.
     * @api
     */
    getLineString(index: number): LineString;
    /**
     * Return the linestrings of this multilinestring.
     * @return {Array<LineString>} LineStrings.
     * @api
     */
    getLineStrings(): Array<LineString>;
    /**
     * Return the sum of all line string lengths
     * @return {number} Length (on projected plane).
     * @api
     */
    getLength(): number;
    /**
     * @return {Array<number>} Flat midpoints.
     */
    getFlatMidpoints(): Array<number>;
    /**
     * @param {number} squaredTolerance Squared tolerance.
     * @return {MultiLineString} Simplified MultiLineString.
     * @protected
     * @override
     */
    protected override getSimplifiedGeometryInternal(squaredTolerance: number): MultiLineString;
    /**
     * Set the coordinates of the multilinestring.
     * @param {!Array<Array<import("../coordinate.js").Coordinate>>} coordinates Coordinates.
     * @param {import("./Geometry.js").GeometryLayout} [layout] Layout.
     * @api
     * @override
     */
    override setCoordinates(coordinates: Array<Array<Coordinate>>, layout?: GeometryLayout): void;
}
//# sourceMappingURL=MultiLineString.d.ts.map

/**
 * @classdesc
 * An array of {@link module:ol/geom/Geometry~Geometry} objects.
 *
 * @api
 */
declare class GeometryCollection extends Geometry {
    /**
     * @param {Array<Geometry>} geometries Geometries.
     */
    constructor(geometries: Array<Geometry>);
    /**
     * @private
     * @type {Array<Geometry>}
     */
    private geometries_;
    /**
     * @private
     * @type {Array<import("../events.js").EventsKey>}
     */
    private changeEventsKeys_;
    /**
     * @private
     */
    private unlistenGeometriesChange_;
    /**
     * @private
     */
    private listenGeometriesChange_;
    /**
     * Make a complete copy of the geometry.
     * @return {!GeometryCollection} Clone.
     * @api
     * @override
     */
    override clone(): GeometryCollection;
    /**
     * Return the geometries that make up this geometry collection.
     * @return {Array<Geometry>} Geometries.
     * @api
     */
    getGeometries(): Array<Geometry>;
    /**
     * @return {Array<Geometry>} Geometries.
     */
    getGeometriesArray(): Array<Geometry>;
    /**
     * @return {Array<Geometry>} Geometries.
     */
    getGeometriesArrayRecursive(): Array<Geometry>;
    /**
     * Create a simplified version of this geometry using the Douglas Peucker algorithm.
     * @param {number} squaredTolerance Squared tolerance.
     * @return {GeometryCollection} Simplified GeometryCollection.
     * @override
     */
    override getSimplifiedGeometry(squaredTolerance: number): GeometryCollection;
    /**
     * @return {boolean} Is empty.
     */
    isEmpty(): boolean;
    /**
     * Set the geometries that make up this geometry collection.
     * @param {Array<Geometry>} geometries Geometries.
     * @api
     */
    setGeometries(geometries: Array<Geometry>): void;
    /**
     * @param {Array<Geometry>} geometries Geometries.
     */
    setGeometriesArray(geometries: Array<Geometry>): void;
}
//# sourceMappingURL=GeometryCollection.d.ts.map

/**
 * @module ol/render/VectorContext
 */
/**
 * @classdesc
 * Context for drawing geometries.  A vector context is available on render
 * events and does not need to be constructed directly.
 * @api
 */
declare class VectorContext {
    /**
     * Render a geometry with a custom renderer.
     *
     * @param {import("../geom/SimpleGeometry.js").default} geometry Geometry.
     * @param {import("../Feature.js").FeatureLike} feature Feature.
     * @param {Function} renderer Renderer.
     * @param {Function} hitDetectionRenderer Renderer.
     * @param {number} [index] Render order index.
     */
    drawCustom(geometry: SimpleGeometry, feature: FeatureLike, renderer: Function, hitDetectionRenderer: Function, index?: number): void;
    /**
     * Render a geometry.
     *
     * @param {import("../geom/Geometry.js").default} geometry The geometry to render.
     */
    drawGeometry(geometry: Geometry): void;
    /**
     * Set the rendering style.
     *
     * @param {import("../style/Style.js").default} style The rendering style.
     */
    setStyle(style: Style$2): void;
    /**
     * @param {import("../geom/Circle.js").default} circleGeometry Circle geometry.
     * @param {import("../Feature.js").default} feature Feature.
     * @param {number} [index] Render order index.
     */
    drawCircle(circleGeometry: Circle, feature: Feature$1, index?: number): void;
    /**
     * @param {import("../Feature.js").default} feature Feature.
     * @param {import("../style/Style.js").default} style Style.
     * @param {number} [index] Render order index.
     */
    drawFeature(feature: Feature$1, style: Style$2, index?: number): void;
    /**
     * @param {import("../geom/GeometryCollection.js").default} geometryCollectionGeometry Geometry collection.
     * @param {import("../Feature.js").default} feature Feature.
     * @param {number} [index] Render order index.
     */
    drawGeometryCollection(geometryCollectionGeometry: GeometryCollection, feature: Feature$1, index?: number): void;
    /**
     * @param {import("../geom/LineString.js").default|import("./Feature.js").default} lineStringGeometry Line string geometry.
     * @param {import("../Feature.js").FeatureLike} feature Feature.
     * @param {number} [index] Render order index.
     */
    drawLineString(lineStringGeometry: LineString | RenderFeature, feature: FeatureLike, index?: number): void;
    /**
     * @param {import("../geom/MultiLineString.js").default|import("./Feature.js").default} multiLineStringGeometry MultiLineString geometry.
     * @param {import("../Feature.js").FeatureLike} feature Feature.
     * @param {number} [index] Render order index.
     */
    drawMultiLineString(multiLineStringGeometry: MultiLineString | RenderFeature, feature: FeatureLike, index?: number): void;
    /**
     * @param {import("../geom/MultiPoint.js").default|import("./Feature.js").default} multiPointGeometry MultiPoint geometry.
     * @param {import("../Feature.js").FeatureLike} feature Feature.
     * @param {number} [index] Render order index.
     */
    drawMultiPoint(multiPointGeometry: MultiPoint | RenderFeature, feature: FeatureLike, index?: number): void;
    /**
     * @param {import("../geom/MultiPolygon.js").default} multiPolygonGeometry MultiPolygon geometry.
     * @param {import("../Feature.js").FeatureLike} feature Feature.
     * @param {number} [index] Render order index.
     */
    drawMultiPolygon(multiPolygonGeometry: MultiPolygon, feature: FeatureLike, index?: number): void;
    /**
     * @param {import("../geom/Point.js").default|import("./Feature.js").default} pointGeometry Point geometry.
     * @param {import("../Feature.js").FeatureLike} feature Feature.
     * @param {number} [index] Render order index.
     */
    drawPoint(pointGeometry: Point$1 | RenderFeature, feature: FeatureLike, index?: number): void;
    /**
     * @param {import("../geom/Polygon.js").default|import("./Feature.js").default} polygonGeometry Polygon geometry.
     * @param {import("../Feature.js").FeatureLike} feature Feature.
     * @param {number} [index] Render order index.
     */
    drawPolygon(polygonGeometry: Polygon | RenderFeature, feature: FeatureLike, index?: number): void;
    /**
     * @param {import("../geom/SimpleGeometry.js").default|import("./Feature.js").default} geometry Geometry.
     * @param {import("../Feature.js").FeatureLike} feature Feature.
     * @param {number} [index] Render order index.
     */
    drawText(geometry: SimpleGeometry | RenderFeature, feature: FeatureLike, index?: number): void;
    /**
     * @param {import("../style/Fill.js").default} fillStyle Fill style.
     * @param {import("../style/Stroke.js").default} strokeStyle Stroke style.
     */
    setFillStrokeStyle(fillStyle: Fill, strokeStyle: Stroke): void;
    /**
     * @param {import("../style/Image.js").default} imageStyle Image style.
     * @param {import("../render/canvas.js").DeclutterImageWithText} [declutterImageWithText] Shared data for combined decluttering with a text style.
     */
    setImageStyle(imageStyle: ImageStyle, declutterImageWithText?: DeclutterImageWithText): void;
    /**
     * @param {import("../style/Text.js").default} textStyle Text style.
     * @param {import("../render/canvas.js").DeclutterImageWithText} [declutterImageWithText] Shared data for combined decluttering with an image style.
     */
    setTextStyle(textStyle: Text, declutterImageWithText?: DeclutterImageWithText): void;
}
//# sourceMappingURL=VectorContext.d.ts.map

declare class BuilderGroup {
    /**
     * @param {number} tolerance Tolerance.
     * @param {import("../../extent.js").Extent} maxExtent Max extent.
     * @param {number} resolution Resolution.
     * @param {number} pixelRatio Pixel ratio.
     */
    constructor(tolerance: number, maxExtent: Extent, resolution: number, pixelRatio: number);
    /**
     * @private
     * @type {number}
     */
    private tolerance_;
    /**
     * @private
     * @type {import("../../extent.js").Extent}
     */
    private maxExtent_;
    /**
     * @private
     * @type {number}
     */
    private pixelRatio_;
    /**
     * @private
     * @type {number}
     */
    private resolution_;
    /**
     * @private
     * @type {!Object<string, !Object<import("../canvas.js").BuilderType, Builder>>}
     */
    private buildersByZIndex_;
    /**
     * @return {!Object<string, !Object<import("../canvas.js").BuilderType, import("./Builder.js").SerializableInstructions>>} The serializable instructions
     */
    finish(): {
        [x: string]: any;
    };
    /**
     * @param {number|undefined} zIndex Z index.
     * @param {import("../canvas.js").BuilderType} builderType Replay type.
     * @return {import("../VectorContext.js").default} Replay.
     */
    getBuilder(zIndex: number | undefined, builderType: BuilderType): VectorContext;
}
//# sourceMappingURL=BuilderGroup.d.ts.map

/**
 * Feature callback. The callback will be called with three arguments. The first
 * argument is one {@link module :ol/Feature~Feature feature} or {@link module :ol/render/Feature~RenderFeature render feature}
 * at the pixel, the second is the {@link module :ol/layer/Layer~Layer layer} of the feature and will be null for
 * unmanaged layers. The third is the {@link module :ol/geom/SimpleGeometry~SimpleGeometry} of the feature. For features
 * with a GeometryCollection geometry, it will be the first detected geometry from the collection.
 */
type FeatureCallback<T> = (arg0: FeatureLike, arg1: Layer<Source>, arg2: SimpleGeometry) => T;

type HitMatch<T> = {
    /**
     * Feature.
     */
    feature: FeatureLike;
    /**
     * Layer.
     */
    layer: Layer;
    /**
     * Geometry.
     */
    geometry: SimpleGeometry;
    /**
     * Squared distance.
     */
    distanceSq: number;
    /**
     * Callback.
     */
    callback: FeatureCallback<T>;
};
/**
 * @template T
 * @typedef HitMatch
 * @property {import("../Feature.js").FeatureLike} feature Feature.
 * @property {import("../layer/Layer.js").default} layer Layer.
 * @property {import("../geom/SimpleGeometry.js").default} geometry Geometry.
 * @property {number} distanceSq Squared distance.
 * @property {import("./vector.js").FeatureCallback<T>} callback Callback.
 */
/**
 * @abstract
 */
declare class MapRenderer extends Disposable {
    /**
     * @param {import("../Map.js").default} map Map.
     */
    constructor(map: Map);
    /**
     * @private
     * @type {import("../Map.js").default}
     */
    private map_;
    /**
     * @abstract
     * @param {import("../render/EventType.js").default} type Event type.
     * @param {import("../Map.js").FrameState} frameState Frame state.
     */
    dispatchRenderEvent(type: any, frameState: FrameState): void;
    /**
     * @param {import("../Map.js").FrameState} frameState FrameState.
     * @protected
     */
    protected calculateMatrices2D(frameState: FrameState): void;
    /**
     * @param {import("../coordinate.js").Coordinate} coordinate Coordinate.
     * @param {import("../Map.js").FrameState} frameState FrameState.
     * @param {number} hitTolerance Hit tolerance in pixels.
     * @param {boolean} checkWrapped Check for wrapped geometries.
     * @param {import("./vector.js").FeatureCallback<T>} callback Feature callback.
     * @param {S} thisArg Value to use as `this` when executing `callback`.
     * @param {function(this: U, import("../layer/Layer.js").default): boolean} layerFilter Layer filter
     *     function, only layers which are visible and for which this function
     *     returns `true` will be tested for features.  By default, all visible
     *     layers will be tested.
     * @param {U} thisArg2 Value to use as `this` when executing `layerFilter`.
     * @return {T|undefined} Callback result.
     * @template S,T,U
     */
    forEachFeatureAtCoordinate<S, T, U>(coordinate: Coordinate, frameState: FrameState, hitTolerance: number, checkWrapped: boolean, callback: FeatureCallback<T>, thisArg: S, layerFilter: (this: U, arg1: Layer) => boolean, thisArg2: U): T | undefined;
    /**
     * @param {import("../coordinate.js").Coordinate} coordinate Coordinate.
     * @param {import("../Map.js").FrameState} frameState FrameState.
     * @param {number} hitTolerance Hit tolerance in pixels.
     * @param {boolean} checkWrapped Check for wrapped geometries.
     * @param {function(this: U, import("../layer/Layer.js").default): boolean} layerFilter Layer filter
     *     function, only layers which are visible and for which this function
     *     returns `true` will be tested for features.  By default, all visible
     *     layers will be tested.
     * @param {U} thisArg Value to use as `this` when executing `layerFilter`.
     * @return {boolean} Is there a feature at the given coordinate?
     * @template U
     */
    hasFeatureAtCoordinate<U>(coordinate: Coordinate, frameState: FrameState, hitTolerance: number, checkWrapped: boolean, layerFilter: (this: U, arg1: Layer) => boolean, thisArg: U): boolean;
    /**
     * @return {import("../Map.js").default} Map.
     */
    getMap(): Map;
    /**
     * Render.
     * @abstract
     * @param {?import("../Map.js").FrameState} frameState Frame state.
     */
    renderFrame(frameState: FrameState | null): void;
    /**
     * @param {import("../Map.js").FrameState} frameState Frame state.
     * @protected
     */
    protected scheduleExpireIconCache(frameState: FrameState): void;
}

/**
 * A css color, or a function called with a view resolution returning a css color.
 */
type BackgroundColor = string | ((arg0: number) => string);
type BaseLayerObjectEventTypes = Types$2 | "change:extent" | "change:maxResolution" | "change:maxZoom" | "change:minResolution" | "change:minZoom" | "change:opacity" | "change:visible" | "change:zIndex";
/**
 * *
 */
type BaseLayerOnSignature<Return> = OnSignature<EventTypes, BaseEvent, Return> & OnSignature<BaseLayerObjectEventTypes, ObjectEvent, Return> & CombinedOnSignature<EventTypes | BaseLayerObjectEventTypes, Return>;
type Options$A = {
    /**
     * A CSS class name to set to the layer element.
     */
    className?: string | undefined;
    /**
     * Opacity (0, 1).
     */
    opacity?: number | undefined;
    /**
     * Visibility.
     */
    visible?: boolean | undefined;
    /**
     * The bounding extent for layer rendering.  The layer will not be
     * rendered outside of this extent.
     */
    extent?: Extent | undefined;
    /**
     * The z-index for layer rendering.  At rendering time, the layers
     * will be ordered, first by Z-index and then by position. When `undefined`, a `zIndex` of 0 is assumed
     * for layers that are added to the map's `layers` collection, or `Infinity` when the layer's `setMap()`
     * method was used.
     */
    zIndex?: number | undefined;
    /**
     * The minimum resolution (inclusive) at which this layer will be
     * visible.
     */
    minResolution?: number | undefined;
    /**
     * The maximum resolution (exclusive) below which this layer will
     * be visible.
     */
    maxResolution?: number | undefined;
    /**
     * The minimum view zoom level (exclusive) above which this layer will be
     * visible.
     */
    minZoom?: number | undefined;
    /**
     * The maximum view zoom level (inclusive) at which this layer will
     * be visible.
     */
    maxZoom?: number | undefined;
    /**
     * Background color for the layer. If not specified, no background
     * will be rendered.
     */
    background?: BackgroundColor | undefined;
    /**
     * Arbitrary observable properties. Can be accessed with `#get()` and `#set()`.
     */
    properties?: {
        [x: string]: any;
    } | undefined;
};
/**
 * A css color, or a function called with a view resolution returning a css color.
 *
 * @typedef {string|function(number):string} BackgroundColor
 * @api
 */
/**
 * @typedef {import("../ObjectEventType").Types|'change:extent'|'change:maxResolution'|'change:maxZoom'|
 *    'change:minResolution'|'change:minZoom'|'change:opacity'|'change:visible'|'change:zIndex'} BaseLayerObjectEventTypes
 */
/***
 * @template Return
 * @typedef {import("../Observable").OnSignature<import("../Observable").EventTypes, import("../events/Event.js").default, Return> &
 *   import("../Observable").OnSignature<BaseLayerObjectEventTypes, import("../Object").ObjectEvent, Return> &
 *   import("../Observable").CombinedOnSignature<import("../Observable").EventTypes|BaseLayerObjectEventTypes, Return>} BaseLayerOnSignature
 */
/**
 * @typedef {Object} Options
 * @property {string} [className='ol-layer'] A CSS class name to set to the layer element.
 * @property {number} [opacity=1] Opacity (0, 1).
 * @property {boolean} [visible=true] Visibility.
 * @property {import("../extent.js").Extent} [extent] The bounding extent for layer rendering.  The layer will not be
 * rendered outside of this extent.
 * @property {number | undefined} [zIndex] The z-index for layer rendering.  At rendering time, the layers
 * will be ordered, first by Z-index and then by position. When `undefined`, a `zIndex` of 0 is assumed
 * for layers that are added to the map's `layers` collection, or `Infinity` when the layer's `setMap()`
 * method was used.
 * @property {number} [minResolution] The minimum resolution (inclusive) at which this layer will be
 * visible.
 * @property {number} [maxResolution] The maximum resolution (exclusive) below which this layer will
 * be visible.
 * @property {number} [minZoom] The minimum view zoom level (exclusive) above which this layer will be
 * visible.
 * @property {number} [maxZoom] The maximum view zoom level (inclusive) at which this layer will
 * be visible.
 * @property {BackgroundColor} [background] Background color for the layer. If not specified, no background
 * will be rendered.
 * @property {Object<string, *>} [properties] Arbitrary observable properties. Can be accessed with `#get()` and `#set()`.
 */
/**
 * @classdesc
 * Abstract base class; normally only used for creating subclasses and not
 * instantiated in apps.
 * Note that with {@link module:ol/layer/Base~BaseLayer} and all its subclasses, any property set in
 * the options is set as a {@link module:ol/Object~BaseObject} property on the layer object, so
 * is observable, and has get/set accessors.
 *
 * @api
 */
declare class BaseLayer extends BaseObject {
    /**
     * @param {Options} options Layer options.
     */
    constructor(options: Options$A);
    /***
     * @type {BaseLayerOnSignature<import("../events").EventsKey>}
     */
    on: BaseLayerOnSignature<EventsKey>;
    /***
     * @type {BaseLayerOnSignature<import("../events").EventsKey>}
     */
    once: BaseLayerOnSignature<EventsKey>;
    /***
     * @type {BaseLayerOnSignature<void>}
     */
    un: BaseLayerOnSignature<void>;
    /**
     * @type {BackgroundColor|false}
     * @private
     */
    private background_;
    /**
     * @type {string}
     * @private
     */
    private className_;
    /**
     * @type {import("./Layer.js").State}
     * @private
     */
    private state_;
    /**
     * Get the background for this layer.
     * @return {BackgroundColor|false} Layer background.
     */
    getBackground(): BackgroundColor | false;
    /**
     * @return {string} CSS class name.
     */
    getClassName(): string;
    /**
     * This method is not meant to be called by layers or layer renderers because the state
     * is incorrect if the layer is included in a layer group.
     *
     * @param {boolean} [managed] Layer is managed.
     * @return {import("./Layer.js").State} Layer state.
     */
    getLayerState(managed?: boolean): State$2;
    /**
     * @abstract
     * @param {Array<import("./Layer.js").default>} [array] Array of layers (to be
     *     modified in place).
     * @return {Array<import("./Layer.js").default>} Array of layers.
     */
    getLayersArray(array?: Array<Layer>): Array<Layer>;
    /**
     * @abstract
     * @param {Array<import("./Layer.js").State>} [states] Optional list of layer
     *     states (to be modified in place).
     * @return {Array<import("./Layer.js").State>} List of layer states.
     */
    getLayerStatesArray(states?: Array<State$2>): Array<State$2>;
    /**
     * Return the {@link module:ol/extent~Extent extent} of the layer or `undefined` if it
     * will be visible regardless of extent.
     * @return {import("../extent.js").Extent|undefined} The layer extent.
     * @observable
     * @api
     */
    getExtent(): Extent | undefined;
    /**
     * Return the maximum resolution of the layer. Returns Infinity if
     * the layer has no maximum resolution set.
     * @return {number} The maximum resolution of the layer.
     * @observable
     * @api
     */
    getMaxResolution(): number;
    /**
     * Return the minimum resolution of the layer. Returns 0 if
     * the layer has no minimum resolution set.
     * @return {number} The minimum resolution of the layer.
     * @observable
     * @api
     */
    getMinResolution(): number;
    /**
     * Return the minimum zoom level of the layer. Returns -Infinity if
     * the layer has no minimum zoom set.
     * @return {number} The minimum zoom level of the layer.
     * @observable
     * @api
     */
    getMinZoom(): number;
    /**
     * Return the maximum zoom level of the layer. Returns Infinity if
     * the layer has no maximum zoom set.
     * @return {number} The maximum zoom level of the layer.
     * @observable
     * @api
     */
    getMaxZoom(): number;
    /**
     * Return the opacity of the layer (between 0 and 1).
     * @return {number} The opacity of the layer.
     * @observable
     * @api
     */
    getOpacity(): number;
    /**
     * @abstract
     * @return {import("../source/Source.js").State} Source state.
     */
    getSourceState(): State;
    /**
     * Return the value of this layer's `visible` property. To find out whether the layer
     * is visible on a map, use `isVisible()` instead.
     * @return {boolean} The value of the `visible` property of the layer.
     * @observable
     * @api
     */
    getVisible(): boolean;
    /**
     * Return the Z-index of the layer, which is used to order layers before
     * rendering. Returns undefined if the layer is unmanaged.
     * @return {number|undefined} The Z-index of the layer.
     * @observable
     * @api
     */
    getZIndex(): number | undefined;
    /**
     * Sets the background color.
     * @param {BackgroundColor} [background] Background color.
     */
    setBackground(background?: BackgroundColor): void;
    /**
     * Set the extent at which the layer is visible.  If `undefined`, the layer
     * will be visible at all extents.
     * @param {import("../extent.js").Extent|undefined} extent The extent of the layer.
     * @observable
     * @api
     */
    setExtent(extent: Extent | undefined): void;
    /**
     * Set the maximum resolution at which the layer is visible.
     * @param {number} maxResolution The maximum resolution of the layer.
     * @observable
     * @api
     */
    setMaxResolution(maxResolution: number): void;
    /**
     * Set the minimum resolution at which the layer is visible.
     * @param {number} minResolution The minimum resolution of the layer.
     * @observable
     * @api
     */
    setMinResolution(minResolution: number): void;
    /**
     * Set the maximum zoom (exclusive) at which the layer is visible.
     * Note that the zoom levels for layer visibility are based on the
     * view zoom level, which may be different from a tile source zoom level.
     * @param {number} maxZoom The maximum zoom of the layer.
     * @observable
     * @api
     */
    setMaxZoom(maxZoom: number): void;
    /**
     * Set the minimum zoom (inclusive) at which the layer is visible.
     * Note that the zoom levels for layer visibility are based on the
     * view zoom level, which may be different from a tile source zoom level.
     * @param {number} minZoom The minimum zoom of the layer.
     * @observable
     * @api
     */
    setMinZoom(minZoom: number): void;
    /**
     * Set the opacity of the layer, allowed values range from 0 to 1.
     * @param {number} opacity The opacity of the layer.
     * @observable
     * @api
     */
    setOpacity(opacity: number): void;
    /**
     * Set the visibility of the layer (`true` or `false`).
     * @param {boolean} visible The visibility of the layer.
     * @observable
     * @api
     */
    setVisible(visible: boolean): void;
    /**
     * Set Z-index of the layer, which is used to order layers before rendering.
     * The default Z-index is 0.
     * @param {number} zindex The z-index of the layer.
     * @observable
     * @api
     */
    setZIndex(zindex: number): void;
}

type MapRenderEventTypes = "postrender" | "precompose" | "postcompose" | "rendercomplete";
type LayerRenderEventTypes = "postrender" | "prerender";

/**
 * @classdesc
 * Events emitted as map events are instances of this type.
 * See {@link module:ol/Map~Map} for which events trigger a map event.
 */
declare class MapEvent extends BaseEvent {
    /**
     * @param {string} type Event type.
     * @param {import("./Map.js").default} map Map.
     * @param {?import("./Map.js").FrameState} [frameState] Frame state.
     */
    constructor(type: string, map: Map, frameState?: FrameState | null);
    /**
     * The map where the event occurred.
     * @type {import("./Map.js").default}
     * @api
     */
    map: Map;
    /**
     * The frame state at the time of the event.
     * @type {?import("./Map.js").FrameState}
     * @api
     */
    frameState: FrameState | null;
}
//# sourceMappingURL=MapEvent.d.ts.map

/**
 * *
 */
type Types$1 = "postrender" | "movestart" | "moveend" | "loadstart" | "loadend";

/**
 * @classdesc
 * Events emitted as map browser events are instances of this type.
 * See {@link module:ol/Map~Map} for which events trigger a map browser event.
 * @template {PointerEvent|KeyboardEvent|WheelEvent} [EVENT=PointerEvent|KeyboardEvent|WheelEvent]
 */
declare class MapBrowserEvent<EVENT extends PointerEvent | KeyboardEvent | WheelEvent = PointerEvent | KeyboardEvent | WheelEvent> extends MapEvent {
    /**
     * @param {string} type Event type.
     * @param {import("./Map.js").default} map Map.
     * @param {EVENT} originalEvent Original event.
     * @param {boolean} [dragging] Is the map currently being dragged?
     * @param {import("./Map.js").FrameState} [frameState] Frame state.
     * @param {Array<PointerEvent>} [activePointers] Active pointers.
     */
    constructor(type: string, map: Map, originalEvent: EVENT, dragging?: boolean, frameState?: FrameState, activePointers?: Array<PointerEvent>);
    /**
     * The original browser event.
     * @const
     * @type {EVENT}
     * @api
     */
    originalEvent: EVENT;
    /**
     * The map pixel relative to the viewport corresponding to the original browser event.
     * @type {?import("./pixel.js").Pixel}
     * @private
     */
    private pixel_;
    /**
     * The coordinate in the user projection corresponding to the original browser event.
     * @type {?import("./coordinate.js").Coordinate}
     * @private
     */
    private coordinate_;
    /**
     * Indicates if the map is currently being dragged. Only set for
     * `POINTERDRAG` and `POINTERMOVE` events. Default is `false`.
     *
     * @type {boolean}
     * @api
     */
    dragging: boolean;
    /**
     * @type {Array<PointerEvent>|undefined}
     */
    activePointers: Array<PointerEvent> | undefined;
    set pixel(pixel: Pixel);
    /**
     * The map pixel relative to the viewport corresponding to the original event.
     * @type {import("./pixel.js").Pixel}
     * @api
     */
    get pixel(): Pixel;
    set coordinate(coordinate: Coordinate);
    /**
     * The coordinate corresponding to the original browser event.  This will be in the user
     * projection if one is set.  Otherwise it will be in the view projection.
     * @type {import("./coordinate.js").Coordinate}
     * @api
     */
    get coordinate(): Coordinate;
}
//# sourceMappingURL=MapBrowserEvent.d.ts.map

/**
 * *
 */
type Types = "singleclick" | "click" | "dblclick" | "pointerdrag" | "pointermove";

/**
 * The overlay position: `'bottom-left'`, `'bottom-center'`,  `'bottom-right'`,
 * `'center-left'`, `'center-center'`, `'center-right'`, `'top-left'`,
 * `'top-center'`, or `'top-right'`.
 */
type Positioning = "bottom-left" | "bottom-center" | "bottom-right" | "center-left" | "center-center" | "center-right" | "top-left" | "top-center" | "top-right";
type Options$z = {
    /**
     * Set the overlay id. The overlay id can be used
     * with the {@link module :ol/Map~Map#getOverlayById} method.
     */
    id?: string | number | undefined;
    /**
     * The overlay element.
     */
    element?: HTMLElement | undefined;
    /**
     * Offsets in pixels used when positioning
     * the overlay. The first element in the
     * array is the horizontal offset. A positive value shifts the overlay right.
     * The second element in the array is the vertical offset. A positive value
     * shifts the overlay down.
     */
    offset?: number[] | undefined;
    /**
     * The overlay position
     * in map projection.
     */
    position?: Coordinate | undefined;
    /**
     * Defines how
     * the overlay is actually positioned with respect to its `position` property.
     * Possible values are `'bottom-left'`, `'bottom-center'`, `'bottom-right'`,
     * `'center-left'`, `'center-center'`, `'center-right'`, `'top-left'`,
     * `'top-center'`, and `'top-right'`.
     */
    positioning?: Positioning | undefined;
    /**
     * Whether event propagation to the map
     * viewport should be stopped. If `true` the overlay is placed in the same
     * container as that of the controls (CSS class name
     * `ol-overlaycontainer-stopevent`); if `false` it is placed in the container
     * with CSS class name specified by the `className` property.
     */
    stopEvent?: boolean | undefined;
    /**
     * Whether the overlay is inserted first
     * in the overlay container, or appended. If the overlay is placed in the same
     * container as that of the controls (see the `stopEvent` option) you will
     * probably set `insertFirst` to `true` so the overlay is displayed below the
     * controls.
     */
    insertFirst?: boolean | undefined;
    /**
     * Pan the map when calling
     * `setPosition`, so that the overlay is entirely visible in the current viewport.
     */
    autoPan?: boolean | PanIntoViewOptions | undefined;
    /**
     * CSS class
     * name.
     */
    className?: string | undefined;
};
type PanOptions = {
    /**
     * The duration of the animation in
     * milliseconds.
     */
    duration?: number | undefined;
    /**
     * The easing function to use. Can
     * be one from {@link module :ol/easing} or a custom function.
     * Default is {@link module :ol/easing.inAndOut}.
     */
    easing?: ((arg0: number) => number) | undefined;
};
type PanIntoViewOptions = {
    /**
     * The animation parameters for the pan
     */
    animation?: PanOptions | undefined;
    /**
     * The margin (in pixels) between the
     * overlay and the borders of the map when panning into view.
     */
    margin?: number | undefined;
};
type OverlayObjectEventTypes = Types$2 | "change:element" | "change:map" | "change:offset" | "change:position" | "change:positioning";
/**
 * *
 */
type OverlayOnSignature<Return> = OnSignature<EventTypes, BaseEvent, Return> & OnSignature<OverlayObjectEventTypes, ObjectEvent, Return> & CombinedOnSignature<EventTypes | OverlayObjectEventTypes, Return>;
/**
 * @typedef {import("./ObjectEventType").Types|'change:element'|'change:map'|'change:offset'|'change:position'|
 *   'change:positioning'} OverlayObjectEventTypes
 */
/***
 * @template Return
 * @typedef {import("./Observable").OnSignature<import("./Observable").EventTypes, import("./events/Event.js").default, Return> &
 *   import("./Observable").OnSignature<OverlayObjectEventTypes, import("./Object").ObjectEvent, Return> &
 *   import("./Observable").CombinedOnSignature<import("./Observable").EventTypes|OverlayObjectEventTypes, Return>} OverlayOnSignature
 */
/**
 * @classdesc
 * An element to be displayed over the map and attached to a single map
 * location.  Like {@link module:ol/control/Control~Control}, Overlays are
 * visible widgets. Unlike Controls, they are not in a fixed position on the
 * screen, but are tied to a geographical coordinate, so panning the map will
 * move an Overlay but not a Control.
 *
 * Example:
 *
 *     import Overlay from 'ol/Overlay.js';
 *
 *     // ...
 *     const popup = new Overlay({
 *       element: document.getElementById('popup'),
 *     });
 *     popup.setPosition(coordinate);
 *     map.addOverlay(popup);
 *
 * @api
 */
declare class Overlay extends BaseObject {
    /**
     * @param {Options} options Overlay options.
     */
    constructor(options: Options$z);
    /***
     * @type {OverlayOnSignature<import("./events").EventsKey>}
     */
    on: OverlayOnSignature<EventsKey>;
    /***
     * @type {OverlayOnSignature<import("./events").EventsKey>}
     */
    once: OverlayOnSignature<EventsKey>;
    /***
     * @type {OverlayOnSignature<void>}
     */
    un: OverlayOnSignature<void>;
    /**
     * @protected
     * @type {Options}
     */
    protected options: Options$z;
    /**
     * @protected
     * @type {number|string|undefined}
     */
    protected id: number | string | undefined;
    /**
     * @protected
     * @type {boolean}
     */
    protected insertFirst: boolean;
    /**
     * @protected
     * @type {boolean}
     */
    protected stopEvent: boolean;
    /**
     * @protected
     * @type {HTMLElement}
     */
    protected element: HTMLElement;
    /**
     * @protected
     * @type {PanIntoViewOptions|undefined}
     */
    protected autoPan: PanIntoViewOptions | undefined;
    /**
     * @protected
     * @type {{transform_: string,
     *         visible: boolean}}
     */
    protected rendered: {
        transform_: string;
        visible: boolean;
    };
    /**
     * @protected
     * @type {?import("./events.js").EventsKey}
     */
    protected mapPostrenderListenerKey: EventsKey | null;
    /**
     * Get the DOM element of this overlay.
     * @return {HTMLElement|undefined} The Element containing the overlay.
     * @observable
     * @api
     */
    getElement(): HTMLElement | undefined;
    /**
     * Get the overlay identifier which is set on constructor.
     * @return {number|string|undefined} Id.
     * @api
     */
    getId(): number | string | undefined;
    /**
     * Get the map associated with this overlay.
     * @return {import("./Map.js").default|null} The map that the
     * overlay is part of.
     * @observable
     * @api
     */
    getMap(): Map | null;
    /**
     * Get the offset of this overlay.
     * @return {Array<number>} The offset.
     * @observable
     * @api
     */
    getOffset(): Array<number>;
    /**
     * Get the current position of this overlay.
     * @return {import("./coordinate.js").Coordinate|undefined} The spatial point that the overlay is
     *     anchored at.
     * @observable
     * @api
     */
    getPosition(): Coordinate | undefined;
    /**
     * Get the current positioning of this overlay.
     * @return {Positioning} How the overlay is positioned
     *     relative to its point on the map.
     * @observable
     * @api
     */
    getPositioning(): Positioning;
    /**
     * @protected
     */
    protected handleElementChanged(): void;
    /**
     * @protected
     */
    protected handleMapChanged(): void;
    /**
     * @protected
     */
    protected render(): void;
    /**
     * @protected
     */
    protected handleOffsetChanged(): void;
    /**
     * @protected
     */
    protected handlePositionChanged(): void;
    /**
     * @protected
     */
    protected handlePositioningChanged(): void;
    /**
     * Set the DOM element to be associated with this overlay.
     * @param {HTMLElement|undefined} element The Element containing the overlay.
     * @observable
     * @api
     */
    setElement(element: HTMLElement | undefined): void;
    /**
     * Set the map to be associated with this overlay.
     * @param {import("./Map.js").default|null} map The map that the
     * overlay is part of. Pass `null` to just remove the overlay from the current map.
     * @observable
     * @api
     */
    setMap(map: Map | null): void;
    /**
     * Set the offset for this overlay.
     * @param {Array<number>} offset Offset.
     * @observable
     * @api
     */
    setOffset(offset: Array<number>): void;
    /**
     * Set the position for this overlay. If the position is `undefined` the
     * overlay is hidden.
     * @param {import("./coordinate.js").Coordinate|undefined} position The spatial point that the overlay
     *     is anchored at.
     * @observable
     * @api
     */
    setPosition(position: Coordinate | undefined): void;
    /**
     * Pan the map so that the overlay is entirely visible in the current viewport
     * (if necessary) using the configured autoPan parameters
     * @protected
     */
    protected performAutoPan(): void;
    /**
     * Pan the map so that the overlay is entirely visible in the current viewport
     * (if necessary).
     * @param {PanIntoViewOptions} [panIntoViewOptions] Options for the pan action
     * @api
     */
    panIntoView(panIntoViewOptions?: PanIntoViewOptions): void;
    /**
     * Get the extent of an element relative to the document
     * @param {HTMLElement} element The element.
     * @param {import("./size.js").Size} size The size of the element.
     * @return {import("./extent.js").Extent} The extent.
     * @protected
     */
    protected getRect(element: HTMLElement, size: Size): Extent;
    /**
     * Set the positioning for this overlay.
     * @param {Positioning} positioning how the overlay is
     *     positioned relative to its point on the map.
     * @observable
     * @api
     */
    setPositioning(positioning: Positioning): void;
    /**
     * Modify the visibility of the element.
     * @param {boolean} visible Element visibility.
     * @protected
     */
    protected setVisible(visible: boolean): void;
    /**
     * Update pixel position.
     * @protected
     */
    protected updatePixelPosition(): void;
    /**
     * @param {import("./pixel.js").Pixel} pixel The pixel location.
     * @param {import("./size.js").Size|undefined} mapSize The map size.
     * @protected
     */
    protected updateRenderedPosition(pixel: Pixel, mapSize: Size | undefined): void;
    /**
     * returns the options this Overlay has been created with
     * @return {Options} overlay options
     */
    getOptions(): Options$z;
}

/**
 * *
 */
type InteractionOnSignature<Return> = OnSignature<EventTypes, BaseEvent, Return> & OnSignature<Types$2 | "change:active", ObjectEvent, Return> & CombinedOnSignature<EventTypes | Types$2 | "change:active", Return>;
/**
 * Object literal with config options for interactions.
 */
type InteractionOptions = {
    /**
     * Method called by the map to notify the interaction that a browser event was
     * dispatched to the map. If the function returns a falsy value, propagation of
     * the event to other interactions in the map's interactions chain will be
     * prevented (this includes functions with no explicit return). The interactions
     * are traversed in reverse order of the interactions collection of the map.
     */
    handleEvent?: ((arg0: MapBrowserEvent) => boolean) | undefined;
};
/***
 * @template Return
 * @typedef {import("../Observable").OnSignature<import("../Observable").EventTypes, import("../events/Event.js").default, Return> &
 *   import("../Observable").OnSignature<import("../ObjectEventType").Types|
 *     'change:active', import("../Object").ObjectEvent, Return> &
 *   import("../Observable").CombinedOnSignature<import("../Observable").EventTypes|import("../ObjectEventType").Types|
 *     'change:active', Return>} InteractionOnSignature
 */
/**
 * Object literal with config options for interactions.
 * @typedef {Object} InteractionOptions
 * @property {function(import("../MapBrowserEvent.js").default):boolean} [handleEvent]
 * Method called by the map to notify the interaction that a browser event was
 * dispatched to the map. If the function returns a falsy value, propagation of
 * the event to other interactions in the map's interactions chain will be
 * prevented (this includes functions with no explicit return). The interactions
 * are traversed in reverse order of the interactions collection of the map.
 */
/**
 * @classdesc
 * Abstract base class; normally only used for creating subclasses and not
 * instantiated in apps.
 * User actions that change the state of the map. Some are similar to controls,
 * but are not associated with a DOM element.
 * For example, {@link module:ol/interaction/KeyboardZoom~KeyboardZoom} is
 * functionally the same as {@link module:ol/control/Zoom~Zoom}, but triggered
 * by a keyboard event not a button element event.
 * Although interactions do not have a DOM element, some of them do render
 * vectors and so are visible on the screen.
 * @api
 */
declare class Interaction extends BaseObject {
    /**
     * @param {InteractionOptions} [options] Options.
     */
    constructor(options?: InteractionOptions);
    /***
     * @type {InteractionOnSignature<import("../events").EventsKey>}
     */
    on: InteractionOnSignature<EventsKey>;
    /***
     * @type {InteractionOnSignature<import("../events").EventsKey>}
     */
    once: InteractionOnSignature<EventsKey>;
    /***
     * @type {InteractionOnSignature<void>}
     */
    un: InteractionOnSignature<void>;
    /**
     * Handles the {@link module:ol/MapBrowserEvent~MapBrowserEvent map browser event}.
     * @param {import("../MapBrowserEvent.js").default} mapBrowserEvent Map browser event.
     * @return {boolean} `false` to stop event propagation.
     * @api
     */
    handleEvent(mapBrowserEvent: MapBrowserEvent): boolean;
    /**
     * @private
     * @type {import("../Map.js").default|null}
     */
    private map_;
    /**
     * Return whether the interaction is currently active.
     * @return {boolean} `true` if the interaction is active, `false` otherwise.
     * @observable
     * @api
     */
    getActive(): boolean;
    /**
     * Get the map associated with this interaction.
     * @return {import("../Map.js").default|null} Map.
     * @api
     */
    getMap(): Map | null;
    /**
     * Activate or deactivate the interaction.
     * @param {boolean} active Active.
     * @observable
     * @api
     */
    setActive(active: boolean): void;
    /**
     * Remove the interaction from its current map and attach it to the new map.
     * Subclasses may set up event handlers to get notified about changes to
     * the map here.
     * @param {import("../Map.js").default|null} map Map.
     */
    setMap(map: Map | null): void;
}

type Options$y = {
    /**
     * The element is the control's
     * container element. This only needs to be specified if you're developing
     * a custom control.
     */
    element?: HTMLElement | undefined;
    /**
     * Function called when
     * the control should be re-rendered. This is called in a `requestAnimationFrame`
     * callback.
     */
    render?: ((arg0: MapEvent) => void) | undefined;
    /**
     * Specify a target if you want
     * the control to be rendered outside of the map's viewport.
     */
    target?: string | HTMLElement | undefined;
};
/**
 * @typedef {Object} Options
 * @property {HTMLElement} [element] The element is the control's
 * container element. This only needs to be specified if you're developing
 * a custom control.
 * @property {function(import("../MapEvent.js").default):void} [render] Function called when
 * the control should be re-rendered. This is called in a `requestAnimationFrame`
 * callback.
 * @property {HTMLElement|string} [target] Specify a target if you want
 * the control to be rendered outside of the map's viewport.
 */
/**
 * @classdesc
 * A control is a visible widget with a DOM element in a fixed position on the
 * screen. They can involve user input (buttons), or be informational only;
 * the position is determined using CSS. By default these are placed in the
 * container with CSS class name `ol-overlaycontainer-stopevent`, but can use
 * any outside DOM element.
 *
 * This is the base class for controls. You can use it for simple custom
 * controls by creating the element with listeners, creating an instance:
 * ```js
 * const myControl = new Control({element: myElement});
 * ```
 * and then adding this to the map.
 *
 * The main advantage of having this as a control rather than a simple separate
 * DOM element is that preventing propagation is handled for you. Controls
 * will also be objects in a {@link module:ol/Collection~Collection}, so you can use their methods.
 *
 * You can also extend this base for your own control class. See
 * examples/custom-controls for an example of how to do this.
 *
 * @api
 */
declare class Control extends BaseObject {
    /**
     * @param {Options} options Control options.
     */
    constructor(options: Options$y);
    /**
     * @protected
     * @type {HTMLElement}
     */
    protected element: HTMLElement;
    /**
     * @private
     * @type {HTMLElement}
     */
    private target_;
    /**
     * @private
     * @type {import("../Map.js").default|null}
     */
    private map_;
    /**
     * @protected
     * @type {!Array<import("../events.js").EventsKey>}
     */
    protected listenerKeys: Array<EventsKey>;
    /**
     * Renders the control.
     * @param {import("../MapEvent.js").default} mapEvent Map event.
     * @api
     */
    render(mapEvent: MapEvent): void;
    /**
     * Get the map associated with this control.
     * @return {import("../Map.js").default|null} Map.
     * @api
     */
    getMap(): Map | null;
    /**
     * Remove the control from its current map and attach it to the new map.
     * Pass `null` to just remove the control from the current map.
     * Subclasses may set up event handlers to get notified about changes to
     * the map here.
     * @param {import("../Map.js").default|null} map Map.
     * @api
     */
    setMap(map: Map | null): void;
    /**
     * This function is used to set a target element for the control. It has no
     * effect if it is called after the control has been added to the map (i.e.
     * after `setMap` is called on the control). If no `target` is set in the
     * options passed to the control constructor and if `setTarget` is not called
     * then the control is added to the map's overlay container.
     * @param {HTMLElement|string} target Target.
     * @api
     */
    setTarget(target: HTMLElement | string): void;
}

/**
 * @classdesc
 * Priority queue.
 *
 * The implementation is inspired from the Closure Library's Heap class and
 * Python's heapq module.
 *
 * See https://github.com/google/closure-library/blob/master/closure/goog/structs/heap.js
 * and https://hg.python.org/cpython/file/2.7/Lib/heapq.py.
 *
 * @template T
 */
declare class PriorityQueue<T> {
    /**
     * @param {function(T): number} priorityFunction Priority function.
     * @param {function(T): string} keyFunction Key function.
     */
    constructor(priorityFunction: (arg0: T) => number, keyFunction: (arg0: T) => string);
    /**
     * @type {function(T): number}
     * @private
     */
    private priorityFunction_;
    /**
     * @type {function(T): string}
     * @private
     */
    private keyFunction_;
    /**
     * @type {Array<T>}
     * @private
     */
    private elements_;
    /**
     * @type {Array<number>}
     * @private
     */
    private priorities_;
    /**
     * @type {!Object<string, boolean>}
     * @private
     */
    private queuedElements_;
    /**
     * FIXME empty description for jsdoc
     */
    clear(): void;
    /**
     * Remove and return the highest-priority element. O(log N).
     * @return {T} Element.
     */
    dequeue(): T;
    /**
     * Enqueue an element. O(log N).
     * @param {T} element Element.
     * @return {boolean} The element was added to the queue.
     */
    enqueue(element: T): boolean;
    /**
     * @return {number} Count.
     */
    getCount(): number;
    /**
     * Gets the index of the left child of the node at the given index.
     * @param {number} index The index of the node to get the left child for.
     * @return {number} The index of the left child.
     * @private
     */
    private getLeftChildIndex_;
    /**
     * Gets the index of the right child of the node at the given index.
     * @param {number} index The index of the node to get the right child for.
     * @return {number} The index of the right child.
     * @private
     */
    private getRightChildIndex_;
    /**
     * Gets the index of the parent of the node at the given index.
     * @param {number} index The index of the node to get the parent for.
     * @return {number} The index of the parent.
     * @private
     */
    private getParentIndex_;
    /**
     * Make this a heap. O(N).
     * @private
     */
    private heapify_;
    /**
     * @return {boolean} Is empty.
     */
    isEmpty(): boolean;
    /**
     * @param {string} key Key.
     * @return {boolean} Is key queued.
     */
    isKeyQueued(key: string): boolean;
    /**
     * @param {T} element Element.
     * @return {boolean} Is queued.
     */
    isQueued(element: T): boolean;
    /**
     * @param {number} index The index of the node to move down.
     * @private
     */
    private siftUp_;
    /**
     * @param {number} startIndex The index of the root.
     * @param {number} index The index of the node to move up.
     * @private
     */
    private siftDown_;
    /**
     * FIXME empty description for jsdoc
     */
    reprioritize(): void;
}

type PriorityFunction = (arg0: Tile, arg1: string, arg2: TileCoord, arg3: number) => number;
type TileQueueElement = [Tile, string, TileCoord, number];
/**
 * @typedef {function(import("./Tile.js").default, string, import('./tilecoord.js').TileCoord, number): number} PriorityFunction
 */
/**
 * @typedef {[import('./Tile.js').default, string, import('./tilecoord.js').TileCoord, number]} TileQueueElement
 */
/**
 * @extends PriorityQueue<TileQueueElement>}
 */
declare class TileQueue extends PriorityQueue<TileQueueElement> {
    /**
     * @param {PriorityFunction} tilePriorityFunction Tile priority function.
     * @param {function(): ?} tileChangeCallback Function called on each tile change event.
     */
    constructor(tilePriorityFunction: PriorityFunction, tileChangeCallback: () => unknown);
    /** @private */
    private boundHandleTileChange_;
    /**
     * @private
     * @type {function(): ?}
     */
    private tileChangeCallback_;
    /**
     * @private
     * @type {number}
     */
    private tilesLoading_;
    /**
     * @private
     * @type {!Object<string,boolean>}
     */
    private tilesLoadingKeys_;
    /**
     * @return {number} Number of tiles loading.
     */
    getTilesLoading(): number;
    /**
     * @param {import("./events/Event.js").default} event Event.
     * @protected
     */
    protected handleTileChange(event: BaseEvent): void;
    /**
     * @param {number} maxTotalLoading Maximum number tiles to load simultaneously.
     * @param {number} maxNewLoads Maximum number of new tiles to load.
     */
    loadMoreTiles(maxTotalLoading: number, maxNewLoads: number): void;
}

/**
 * @classdesc
 * Events emitted by {@link module:ol/Collection~Collection} instances are instances of this
 * type.
 * @template T
 */
declare class CollectionEvent<T> extends BaseEvent {
    /**
     * @param {import("./CollectionEventType.js").default} type Type.
     * @param {T} element Element.
     * @param {number} index The index of the added or removed element.
     */
    constructor(type: any, element: T, index: number);
    /**
     * The element that is added to or removed from the collection.
     * @type {T}
     * @api
     */
    element: T;
    /**
     * The index of the added or removed element.
     * @type {number}
     * @api
     */
    index: number;
}

/**
 * *
 */
type CollectionOnSignature<T, Return> = OnSignature<EventTypes, BaseEvent, Return> & OnSignature<Types$2 | "change:length", ObjectEvent, Return> & OnSignature<"add" | "remove", CollectionEvent<T>, Return> & CombinedOnSignature<EventTypes | Types$2 | "change:length" | "add" | "remove", Return>;
type Options$x = {
    /**
     * Disallow the same item from being added to
     * the collection twice.
     */
    unique?: boolean | undefined;
};

/***
 * @template T
 * @template Return
 * @typedef {import("./Observable").OnSignature<import("./Observable").EventTypes, import("./events/Event.js").default, Return> &
 *   import("./Observable").OnSignature<import("./ObjectEventType").Types|'change:length', import("./Object").ObjectEvent, Return> &
 *   import("./Observable").OnSignature<'add'|'remove', CollectionEvent<T>, Return> &
 *   import("./Observable").CombinedOnSignature<import("./Observable").EventTypes|import("./ObjectEventType").Types|
 *     'change:length'|'add'|'remove',Return>} CollectionOnSignature
 */
/**
 * @typedef {Object} Options
 * @property {boolean} [unique=false] Disallow the same item from being added to
 * the collection twice.
 */
/**
 * @classdesc
 * An expanded version of standard JS Array, adding convenience methods for
 * manipulation. Add and remove changes to the Collection trigger a Collection
 * event. Note that this does not cover changes to the objects _within_ the
 * Collection; they trigger events on the appropriate object, not on the
 * Collection as a whole.
 *
 * @fires CollectionEvent
 *
 * @template T
 * @api
 */
declare class Collection<T> extends BaseObject {
    /**
     * @param {Array<T>} [array] Array.
     * @param {Options} [options] Collection options.
     */
    constructor(array?: Array<T>, options?: Options$x);
    /***
     * @type {CollectionOnSignature<T, import("./events").EventsKey>}
     */
    on: CollectionOnSignature<T, EventsKey>;
    /***
     * @type {CollectionOnSignature<T, import("./events").EventsKey>}
     */
    once: CollectionOnSignature<T, EventsKey>;
    /***
     * @type {CollectionOnSignature<T, void>}
     */
    un: CollectionOnSignature<T, void>;
    /**
     * @private
     * @type {boolean}
     */
    private unique_;
    /**
     * @private
     * @type {!Array<T>}
     */
    private array_;
    /**
     * Remove all elements from the collection.
     * @api
     */
    clear(): void;
    /**
     * Add elements to the collection.  This pushes each item in the provided array
     * to the end of the collection.
     * @param {!Array<T>} arr Array.
     * @return {Collection<T>} This collection.
     * @api
     */
    extend(arr: Array<T>): Collection<T>;
    /**
     * Iterate over each element, calling the provided callback.
     * @param {function(T, number, Array<T>): *} f The function to call
     *     for every element. This function takes 3 arguments (the element, the
     *     index and the array). The return value is ignored.
     * @api
     */
    forEach(f: (arg0: T, arg1: number, arg2: Array<T>) => any): void;
    /**
     * Get a reference to the underlying Array object. Warning: if the array
     * is mutated, no events will be dispatched by the collection, and the
     * collection's "length" property won't be in sync with the actual length
     * of the array.
     * @return {!Array<T>} Array.
     * @api
     */
    getArray(): Array<T>;
    /**
     * Get the element at the provided index.
     * @param {number} index Index.
     * @return {T} Element.
     * @api
     */
    item(index: number): T;
    /**
     * Get the length of this collection.
     * @return {number} The length of the array.
     * @observable
     * @api
     */
    getLength(): number;
    /**
     * Insert an element at the provided index.
     * @param {number} index Index.
     * @param {T} elem Element.
     * @api
     */
    insertAt(index: number, elem: T): void;
    /**
     * Remove the last element of the collection and return it.
     * Return `undefined` if the collection is empty.
     * @return {T|undefined} Element.
     * @api
     */
    pop(): T | undefined;
    /**
     * Insert the provided element at the end of the collection.
     * @param {T} elem Element.
     * @return {number} New length of the collection.
     * @api
     */
    push(elem: T): number;
    /**
     * Remove the first occurrence of an element from the collection.
     * @param {T} elem Element.
     * @return {T|undefined} The removed element or undefined if none found.
     * @api
     */
    remove(elem: T): T | undefined;
    /**
     * Remove the element at the provided index and return it.
     * Return `undefined` if the collection does not contain this index.
     * @param {number} index Index.
     * @return {T|undefined} Value.
     * @api
     */
    removeAt(index: number): T | undefined;
    /**
     * Set the element at the provided index.
     * @param {number} index Index.
     * @param {T} elem Element.
     * @api
     */
    setAt(index: number, elem: T): void;
    /**
     * @private
     */
    private updateLength_;
    /**
     * @private
     * @param {T} elem Element.
     * @param {number} [except] Optional index to ignore.
     */
    private assertUnique_;
}

/**
 * @classdesc
 * A layer group triggers 'addlayer' and 'removelayer' events when layers are added to or removed from
 * the group or one of its child groups.  When a layer group is added to or removed from another layer group,
 * a single event will be triggered (instead of one per layer in the group added or removed).
 */
declare class GroupEvent extends BaseEvent {
    /**
     * @param {GroupEventType} type The event type.
     * @param {BaseLayer} layer The layer.
     */
    constructor(type: GroupEventType, layer: BaseLayer);
    /**
     * The added or removed layer.
     * @type {BaseLayer}
     * @api
     */
    layer: BaseLayer;
}

/**
 * *
 */
type GroupOnSignature<Return> = OnSignature<EventTypes, BaseEvent, Return> & OnSignature<BaseLayerObjectEventTypes | "change:layers", ObjectEvent, Return> & OnSignature<"addlayer" | "removelayer", GroupEvent, Return> & CombinedOnSignature<EventTypes | BaseLayerObjectEventTypes | "addlayer" | "removelayer" | "change:layers", Return>;
type Options$w = {
    /**
     * Opacity (0, 1).
     */
    opacity?: number | undefined;
    /**
     * Visibility.
     */
    visible?: boolean | undefined;
    /**
     * The bounding extent for layer rendering.  The layer will not be
     * rendered outside of this extent.
     */
    extent?: Extent | undefined;
    /**
     * The z-index for layer rendering.  At rendering time, the layers
     * will be ordered, first by Z-index and then by position. When `undefined`, a `zIndex` of 0 is assumed
     * for layers that are added to the map's `layers` collection, or `Infinity` when the layer's `setMap()`
     * method was used.
     */
    zIndex?: number | undefined;
    /**
     * The minimum resolution (inclusive) at which this layer will be
     * visible.
     */
    minResolution?: number | undefined;
    /**
     * The maximum resolution (exclusive) below which this layer will
     * be visible.
     */
    maxResolution?: number | undefined;
    /**
     * The minimum view zoom level (exclusive) above which this layer will be
     * visible.
     */
    minZoom?: number | undefined;
    /**
     * The maximum view zoom level (inclusive) at which this layer will
     * be visible.
     */
    maxZoom?: number | undefined;
    /**
     * Child layers.
     */
    layers?: BaseLayer[] | Collection<BaseLayer> | undefined;
    /**
     * Arbitrary observable properties. Can be accessed with `#get()` and `#set()`.
     */
    properties?: {
        [x: string]: any;
    } | undefined;
};

type GroupEventType = string;
declare namespace GroupEventType {
    let ADDLAYER: string;
    let REMOVELAYER: string;
}
/**
 * @classdesc
 * A {@link module:ol/Collection~Collection} of layers that are handled together.
 *
 * A generic `change` event is triggered when the group/Collection changes.
 *
 * @fires GroupEvent
 * @api
 */
declare class LayerGroup extends BaseLayer {
    /**
     * @param {Options} [options] Layer options.
     */
    constructor(options?: Options$w);
    /***
     * @type {GroupOnSignature<import("../events").EventsKey>}
     */
    on: GroupOnSignature<EventsKey>;
    /***
     * @type {GroupOnSignature<import("../events").EventsKey>}
     */
    once: GroupOnSignature<EventsKey>;
    /***
     * @type {GroupOnSignature<void>}
     */
    un: GroupOnSignature<void>;
    /**
     * @private
     * @type {Array<import("../events.js").EventsKey>}
     */
    private layersListenerKeys_;
    /**
     * @private
     * @type {Object<string, Array<import("../events.js").EventsKey>>}
     */
    private listenerKeys_;
    /**
     * @private
     */
    private handleLayerChange_;
    /**
     * @private
     */
    private handleLayersChanged_;
    /**
     * @param {BaseLayer} layer The layer.
     */
    registerLayerListeners_(layer: BaseLayer): void;
    /**
     * @param {GroupEvent} event The layer group event.
     */
    handleLayerGroupAdd_(event: GroupEvent): void;
    /**
     * @param {GroupEvent} event The layer group event.
     */
    handleLayerGroupRemove_(event: GroupEvent): void;
    /**
     * @param {import("../Collection.js").CollectionEvent<import("./Base.js").default>} collectionEvent CollectionEvent.
     * @private
     */
    private handleLayersAdd_;
    /**
     * @param {import("../Collection.js").CollectionEvent<import("./Base.js").default>} collectionEvent CollectionEvent.
     * @private
     */
    private handleLayersRemove_;
    /**
     * Returns the {@link module:ol/Collection~Collection collection} of {@link module:ol/layer/Layer~Layer layers}
     * in this group.
     * @return {!Collection<import("./Base.js").default>} Collection of
     *   {@link module:ol/layer/Base~BaseLayer layers} that are part of this group.
     * @observable
     * @api
     */
    getLayers(): Collection<BaseLayer>;
    /**
     * Set the {@link module:ol/Collection~Collection collection} of {@link module:ol/layer/Layer~Layer layers}
     * in this group.
     * @param {!Collection<import("./Base.js").default>} layers Collection of
     *   {@link module:ol/layer/Base~BaseLayer layers} that are part of this group.
     * @observable
     * @api
     */
    setLayers(layers: Collection<BaseLayer>): void;
}

/**
 * State of the current frame. Only `pixelRatio`, `time` and `viewState` should
 * be used in applications.
 */
type FrameState = {
    /**
     * The pixel ratio of the frame.
     */
    pixelRatio: number;
    /**
     * The time when rendering of the frame was requested.
     */
    time: number;
    /**
     * The state of the current view.
     */
    viewState: State$1;
    /**
     * Animate.
     */
    animate: boolean;
    /**
     * CoordinateToPixelTransform.
     */
    coordinateToPixelTransform: Transform;
    /**
     * Declutter trees by declutter group.
     * When null, no decluttering is needed because no layers have decluttering enabled.
     */
    declutter: {
        [x: string]: rbush.default<DeclutterEntry>;
    } | null;
    /**
     * Extent (in view projection coordinates).
     */
    extent: null | Extent;
    /**
     * Next extent during an animation series.
     */
    nextExtent?: Extent | undefined;
    /**
     * Index.
     */
    index: number;
    /**
     * LayerStatesArray.
     */
    layerStatesArray: Array<State$2>;
    /**
     * LayerIndex.
     */
    layerIndex: number;
    /**
     * PixelToCoordinateTransform.
     */
    pixelToCoordinateTransform: Transform;
    /**
     * PostRenderFunctions.
     */
    postRenderFunctions: Array<PostRenderFunction>;
    /**
     * Size.
     */
    size: Size;
    /**
     * TileQueue.
     */
    tileQueue: TileQueue;
    /**
     * UsedTiles.
     */
    usedTiles: {
        [x: string]: {
            [x: string]: boolean;
        };
    };
    /**
     * ViewHints.
     */
    viewHints: Array<number>;
    /**
     * WantedTiles.
     */
    wantedTiles: {
        [x: string]: {
            [x: string]: boolean;
        };
    };
    /**
     * The id of the map.
     */
    mapId: string;
    /**
     * Identifiers of previously rendered elements.
     */
    renderTargets: {
        [x: string]: boolean;
    };
};
type PostRenderFunction = (arg0: Map, arg1: FrameState) => any;
type AtPixelOptions = {
    /**
     * Layer filter
     * function. The filter function will receive one argument, the
     * {@link module :ol/layer/Layer~Layer layer-candidate} and it should return a boolean value.
     * Only layers which are visible and for which this function returns `true`
     * will be tested for features. By default, all visible layers will be tested.
     */
    layerFilter?: undefined | ((arg0: Layer<Source>) => boolean);
    /**
     * Hit-detection tolerance in css pixels. Pixels
     * inside the radius around the given position will be checked for features.
     */
    hitTolerance?: number | undefined;
    /**
     * Check-Wrapped Will check for wrapped geometries inside the range of
     * +/- 1 world width. Works only if a projection is used that can be wrapped.
     */
    checkWrapped?: boolean | undefined;
};
type MapObjectEventTypes = Types$2 | "change:layergroup" | "change:size" | "change:target" | "change:view";
/**
 * *
 */
type MapEventHandler<Return> = OnSignature<EventTypes, BaseEvent, Return> & OnSignature<MapObjectEventTypes, ObjectEvent, Return> & OnSignature<Types, MapBrowserEvent, Return> & OnSignature<Types$1, MapEvent, Return> & OnSignature<MapRenderEventTypes, RenderEvent, Return> & CombinedOnSignature<EventTypes | MapObjectEventTypes | Types | Types$1 | MapRenderEventTypes, Return>;
/**
 * Object literal with config options for the map.
 */
type MapOptions = {
    /**
     * Controls initially added to the map. If not specified,
     * {@link module :ol/control/defaults.defaults} is used. In a worker, no controls are added by default.
     */
    controls?: Collection<Control> | Control[] | undefined;
    /**
     * The ratio between
     * physical pixels and device-independent pixels (dips) on the device.
     */
    pixelRatio?: number | undefined;
    /**
     * Interactions that are initially added to the map. If not specified,
     * {@link module :ol/interaction/defaults.defaults} is used. In a worker, no interactions are added by default.
     */
    interactions?: Collection<Interaction> | Interaction[] | undefined;
    /**
     * The element to
     * listen to keyboard events on. This determines when the `KeyboardPan` and
     * `KeyboardZoom` interactions trigger. For example, if this option is set to
     * `document` the keyboard interactions will always trigger. If this option is
     * not specified, the element the library listens to keyboard events on is the
     * map target (i.e. the user-provided div for the map). If this is not
     * `document`, the target element needs to be focused for key events to be
     * emitted, requiring that the target element has a `tabindex` attribute.
     */
    keyboardEventTarget?: string | Document | HTMLElement | undefined;
    /**
     * Layers. If this is not defined, a map with no layers will be rendered. Note
     * that layers are rendered in the order supplied, so if you want, for example,
     * a vector layer to appear on top of a tile layer, it must come after the tile
     * layer.
     */
    layers?: BaseLayer[] | Collection<BaseLayer> | LayerGroup | undefined;
    /**
     * Maximum number tiles to load
     * simultaneously.
     */
    maxTilesLoading?: number | undefined;
    /**
     * The minimum distance in pixels the
     * cursor must move to be detected as a map move event instead of a click.
     * Increasing this value can make it easier to click on the map.
     */
    moveTolerance?: number | undefined;
    /**
     * Overlays initially added to the map. By default, no overlays are added.
     */
    overlays?: Collection<Overlay> | Overlay[] | undefined;
    /**
     * The container for the map, either the
     * element itself or the `id` of the element. If not specified at construction
     * time, {@link module :ol/Map~Map#setTarget} must be called for the map to be
     * rendered. If passed by element, the container can be in a secondary document.
     * For use in workers or when exporting a map, use an `OffscreenCanvas` or `HTMLCanvasElement` as target.
     * For accessibility (focus and keyboard events for map navigation), the `target` element must have a
     * properly configured `tabindex` attribute. If the `target` element is inside a Shadow DOM, the
     * `tabindex` atribute must be set on the custom element's host element.
     * **Note:** CSS `transform` support for the target element is limited to `scale`.
     */
    target?: string | HTMLElement | HTMLCanvasElement | OffscreenCanvas | undefined;
    /**
     * The map's view.  No layer sources will be
     * fetched unless this is specified at construction time or through
     * {@link module :ol/Map~Map#setView}.
     */
    view?: View | Promise<ViewOptions> | undefined;
};
/**
 * @classdesc
 * The map is the core component of OpenLayers. For a map to render, a view,
 * one or more layers, and a target container are needed:
 *
 *     import Map from 'ol/Map.js';
 *     import View from 'ol/View.js';
 *     import TileLayer from 'ol/layer/Tile.js';
 *     import OSM from 'ol/source/OSM.js';
 *
 *     const map = new Map({
 *       view: new View({
 *         center: [0, 0],
 *         zoom: 1,
 *       }),
 *       layers: [
 *         new TileLayer({
 *           source: new OSM(),
 *         }),
 *       ],
 *       target: 'map',
 *     });
 *
 * The above snippet creates a map using a {@link module:ol/layer/Tile~TileLayer} to
 * display {@link module:ol/source/OSM~OSM} OSM data and render it to a DOM
 * element with the id `map`.
 *
 * The constructor places a viewport container (with CSS class name
 * `ol-viewport`) in the target element (see `getViewport()`), and then two
 * further elements within the viewport: one with CSS class name
 * `ol-overlaycontainer-stopevent` for controls and some overlays, and one with
 * CSS class name `ol-overlaycontainer` for other overlays (see the `stopEvent`
 * option of {@link module:ol/Overlay~Overlay} for the difference). The map
 * itself is placed in a further element within the viewport.
 *
 * Layers are stored as a {@link module:ol/Collection~Collection} in
 * layerGroups. A top-level group is provided by the library. This is what is
 * accessed by `getLayerGroup` and `setLayerGroup`. Layers entered in the
 * options are added to this group, and `addLayer` and `removeLayer` change the
 * layer collection in the group. `getLayers` is a convenience function for
 * `getLayerGroup().getLayers()`. Note that {@link module:ol/layer/Group~LayerGroup}
 * is a subclass of {@link module:ol/layer/Base~BaseLayer}, so layers entered in the
 * options or added with `addLayer` can be groups, which can contain further
 * groups, and so on.
 *
 * @fires import("./MapBrowserEvent.js").MapBrowserEvent
 * @fires import("./MapEvent.js").MapEvent
 * @fires import("./render/Event.js").default#precompose
 * @fires import("./render/Event.js").default#postcompose
 * @fires import("./render/Event.js").default#rendercomplete
 * @api
 */
declare class Map extends BaseObject {
    /**
     * @param {MapOptions} [options] Map options.
     */
    constructor(options?: MapOptions);
    /***
     * @type {MapEventHandler<import("./events").EventsKey>}
     */
    on: MapEventHandler<EventsKey>;
    /***
     * @type {MapEventHandler<import("./events").EventsKey>}
     */
    once: MapEventHandler<EventsKey>;
    /***
     * @type {MapEventHandler<void>}
     */
    un: MapEventHandler<void>;
    /**
     * @private
     * @type {boolean}
     */
    private renderComplete_;
    /**
     * @private
     * @type {boolean}
     */
    private loaded_;
    /** @private */
    private boundHandleBrowserEvent_;
    /**
     * @type {number}
     * @private
     */
    private maxTilesLoading_;
    /**
     * @private
     * @type {number}
     */
    private pixelRatio_;
    /**
     * @private
     * @type {ReturnType<typeof setTimeout>}
     */
    private postRenderTimeoutHandle_;
    /**
     * @private
     * @type {number|undefined}
     */
    private animationDelayKey_;
    /**
     * @private
     */
    private animationDelay_;
    /**
     * @private
     * @type {import("./transform.js").Transform}
     */
    private coordinateToPixelTransform_;
    /**
     * @private
     * @type {import("./transform.js").Transform}
     */
    private pixelToCoordinateTransform_;
    /**
     * @private
     * @type {number}
     */
    private frameIndex_;
    /**
     * @private
     * @type {?FrameState}
     */
    private frameState_;
    /**
     * The extent at the previous 'moveend' event.
     * @private
     * @type {import("./extent.js").Extent}
     */
    private previousExtent_;
    /**
     * @private
     * @type {?import("./events.js").EventsKey}
     */
    private viewPropertyListenerKey_;
    /**
     * @private
     * @type {?import("./events.js").EventsKey}
     */
    private viewChangeListenerKey_;
    /**
     * @private
     * @type {?Array<import("./events.js").EventsKey>}
     */
    private layerGroupPropertyListenerKeys_;
    viewport_: HTMLDivElement | undefined;
    /**
     * @private
     * @type {!HTMLElement}
     */
    private overlayContainer_;
    /**
     * @private
     * @type {!HTMLElement}
     */
    private overlayContainerStopEvent_;
    /**
     * @private
     * @type {MapBrowserEventHandler}
     */
    private mapBrowserEventHandler_;
    /**
     * @private
     * @type {number}
     */
    private moveTolerance_;
    /**
     * @private
     * @type {HTMLElement|Document}
     */
    private keyboardEventTarget_;
    /**
     * @private
     * @type {?Array<import("./events.js").EventsKey>}
     */
    private targetChangeHandlerKeys_;
    /**
     * @private
     * @type {HTMLElement|null}
     */
    private targetElement_;
    /**
     * @private
     * @type {ResizeObserver}
     */
    private resizeObserver_;
    /**
     * @type {Collection<import("./control/Control.js").default>}
     * @protected
     */
    protected controls: Collection<Control>;
    /**
     * @type {Collection<import("./interaction/Interaction.js").default>}
     * @protected
     */
    protected interactions: Collection<Interaction>;
    /**
     * @type {Collection<import("./Overlay.js").default>}
     * @private
     */
    private overlays_;
    /**
     * A lookup of overlays by id.
     * @private
     * @type {Object<string, import("./Overlay.js").default>}
     */
    private overlayIdIndex_;
    /**
     * @type {import("./renderer/Map.js").default|null}
     * @private
     */
    private renderer_;
    /**
     * @private
     * @type {!Array<PostRenderFunction>}
     */
    private postRenderFunctions_;
    /**
     * @private
     * @type {TileQueue}
     */
    private tileQueue_;
    /**
     * Add the given control to the map.
     * @param {import("./control/Control.js").default} control Control.
     * @api
     */
    addControl(control: Control): void;
    /**
     * Add the given interaction to the map. If you want to add an interaction
     * at another point of the collection use `getInteractions()` and the methods
     * available on {@link module:ol/Collection~Collection}. This can be used to
     * stop the event propagation from the handleEvent function. The interactions
     * get to handle the events in the reverse order of this collection.
     * @param {import("./interaction/Interaction.js").default} interaction Interaction to add.
     * @api
     */
    addInteraction(interaction: Interaction): void;
    /**
     * Adds the given layer to the top of this map. If you want to add a layer
     * elsewhere in the stack, use `getLayers()` and the methods available on
     * {@link module:ol/Collection~Collection}.
     * @param {import("./layer/Base.js").default} layer Layer.
     * @api
     */
    addLayer(layer: BaseLayer): void;
    /**
     * @param {import("./layer/Group.js").GroupEvent} event The layer add event.
     * @private
     */
    private handleLayerAdd_;
    /**
     * Add the given overlay to the map.
     * @param {import("./Overlay.js").default} overlay Overlay.
     * @api
     */
    addOverlay(overlay: Overlay): void;
    /**
     * This deals with map's overlay collection changes.
     * @param {import("./Overlay.js").default} overlay Overlay.
     * @private
     */
    private addOverlayInternal_;
    /**
     * Detect features that intersect a pixel on the viewport, and execute a
     * callback with each intersecting feature. Layers included in the detection can
     * be configured through the `layerFilter` option in `options`.
     * For polygons without a fill, only the stroke will be used for hit detection.
     * Polygons must have a fill style applied to ensure that pixels inside a polygon are detected.
     * The fill can be transparent.
     * @param {import("./pixel.js").Pixel} pixel Pixel.
     * @param {function(import("./Feature.js").FeatureLike, import("./layer/Layer.js").default<import("./source/Source").default>, import("./geom/SimpleGeometry.js").default): T} callback Feature callback. The callback will be
     *     called with two arguments. The first argument is one
     *     {@link module:ol/Feature~Feature feature} or
     *     {@link module:ol/render/Feature~RenderFeature render feature} at the pixel, the second is
     *     the {@link module:ol/layer/Layer~Layer layer} of the feature and will be null for
     *     unmanaged layers. To stop detection, callback functions can return a
     *     truthy value.
     * @param {AtPixelOptions} [options] Optional options.
     * @return {T|undefined} Callback result, i.e. the return value of last
     * callback execution, or the first truthy callback return value.
     * @template T
     * @api
     */
    forEachFeatureAtPixel<T>(pixel: Pixel, callback: (arg0: FeatureLike, arg1: Layer<Source>, arg2: SimpleGeometry) => T, options?: AtPixelOptions): T | undefined;
    /**
     * Get all features that intersect a pixel on the viewport.
     * For polygons without a fill, only the stroke will be used for hit detection.
     * Polygons must have a fill style applied to ensure that pixels inside a polygon are detected.
     * The fill can be transparent.
     * @param {import("./pixel.js").Pixel} pixel Pixel.
     * @param {AtPixelOptions} [options] Optional options.
     * @return {Array<import("./Feature.js").FeatureLike>} The detected features or
     * an empty array if none were found.
     * @api
     */
    getFeaturesAtPixel(pixel: Pixel, options?: AtPixelOptions): Array<FeatureLike>;
    /**
     * Get all layers from all layer groups.
     * @return {Array<import("./layer/Layer.js").default>} Layers.
     * @api
     */
    getAllLayers(): Array<Layer>;
    /**
     * Detect if features intersect a pixel on the viewport. Layers included in the
     * detection can be configured through the `layerFilter` option.
     * For polygons without a fill, only the stroke will be used for hit detection.
     * Polygons must have a fill style applied to ensure that pixels inside a polygon are detected.
     * The fill can be transparent.
     * @param {import("./pixel.js").Pixel} pixel Pixel.
     * @param {AtPixelOptions} [options] Optional options.
     * @return {boolean} Is there a feature at the given pixel?
     * @api
     */
    hasFeatureAtPixel(pixel: Pixel, options?: AtPixelOptions): boolean;
    /**
     * Returns the coordinate in user projection for a browser event.
     * @param {MouseEvent} event Event.
     * @return {import("./coordinate.js").Coordinate} Coordinate.
     * @api
     */
    getEventCoordinate(event: MouseEvent): Coordinate;
    /**
     * Returns the coordinate in view projection for a browser event.
     * @param {MouseEvent} event Event.
     * @return {import("./coordinate.js").Coordinate} Coordinate.
     */
    getEventCoordinateInternal(event: MouseEvent): Coordinate;
    /**
     * Returns the map pixel position for a browser event relative to the viewport.
     * @param {UIEvent|{clientX: number, clientY: number}} event Event.
     * @return {import("./pixel.js").Pixel} Pixel.
     * @api
     */
    getEventPixel(event: UIEvent | {
        clientX: number;
        clientY: number;
    }): Pixel;
    /**
     * Get the target in which this map is rendered.
     * Note that this returns what is entered as an option or in setTarget:
     * if that was an element, it returns an element; if a string, it returns that.
     * @return {HTMLElement|string|undefined} The Element or id of the Element that the
     *     map is rendered in.
     * @observable
     * @api
     */
    getTarget(): HTMLElement | string | undefined;
    /**
     * Get the DOM element into which this map is rendered. In contrast to
     * `getTarget` this method always return an `Element`, or `null` if the
     * map has no target.
     * @return {HTMLElement} The element that the map is rendered in.
     * @api
     */
    getTargetElement(): HTMLElement;
    /**
     * Get the coordinate for a given pixel.  This returns a coordinate in the
     * user projection.
     * @param {import("./pixel.js").Pixel} pixel Pixel position in the map viewport.
     * @return {import("./coordinate.js").Coordinate} The coordinate for the pixel position.
     * @api
     */
    getCoordinateFromPixel(pixel: Pixel): Coordinate;
    /**
     * Get the coordinate for a given pixel.  This returns a coordinate in the
     * map view projection.
     * @param {import("./pixel.js").Pixel} pixel Pixel position in the map viewport.
     * @return {import("./coordinate.js").Coordinate} The coordinate for the pixel position.
     */
    getCoordinateFromPixelInternal(pixel: Pixel): Coordinate;
    /**
     * Get the map controls. Modifying this collection changes the controls
     * associated with the map.
     * @return {Collection<import("./control/Control.js").default>} Controls.
     * @api
     */
    getControls(): Collection<Control>;
    /**
     * Get the map overlays. Modifying this collection changes the overlays
     * associated with the map.
     * @return {Collection<import("./Overlay.js").default>} Overlays.
     * @api
     */
    getOverlays(): Collection<Overlay>;
    /**
     * Get an overlay by its identifier (the value returned by overlay.getId()).
     * Note that the index treats string and numeric identifiers as the same. So
     * `map.getOverlayById(2)` will return an overlay with id `'2'` or `2`.
     * @param {string|number} id Overlay identifier.
     * @return {import("./Overlay.js").default|null} Overlay.
     * @api
     */
    getOverlayById(id: string | number): Overlay | null;
    /**
     * Get the map interactions. Modifying this collection changes the interactions
     * associated with the map.
     *
     * Interactions are used for e.g. pan, zoom and rotate.
     * @return {Collection<import("./interaction/Interaction.js").default>} Interactions.
     * @api
     */
    getInteractions(): Collection<Interaction>;
    /**
     * Get the layergroup associated with this map.
     * @return {LayerGroup} A layer group containing the layers in this map.
     * @observable
     * @api
     */
    getLayerGroup(): LayerGroup;
    /**
     * Clear any existing layers and add layers to the map.
     * @param {Array<import("./layer/Base.js").default>|Collection<import("./layer/Base.js").default>} layers The layers to be added to the map.
     * @api
     */
    setLayers(layers: Array<BaseLayer> | Collection<BaseLayer>): void;
    /**
     * Get the collection of layers associated with this map.
     * @return {!Collection<import("./layer/Base.js").default>} Layers.
     * @api
     */
    getLayers(): Collection<BaseLayer>;
    /**
     * @return {boolean} Layers have sources that are still loading.
     */
    getLoadingOrNotReady(): boolean;
    /**
     * Get the pixel for a coordinate.  This takes a coordinate in the user
     * projection and returns the corresponding pixel.
     * @param {import("./coordinate.js").Coordinate} coordinate A map coordinate.
     * @return {import("./pixel.js").Pixel} A pixel position in the map viewport.
     * @api
     */
    getPixelFromCoordinate(coordinate: Coordinate): Pixel;
    /**
     * Get the pixel for a coordinate.  This takes a coordinate in the map view
     * projection and returns the corresponding pixel.
     * @param {import("./coordinate.js").Coordinate} coordinate A map coordinate.
     * @return {import("./pixel.js").Pixel} A pixel position in the map viewport.
     */
    getPixelFromCoordinateInternal(coordinate: Coordinate): Pixel;
    /**
     * Get the map renderer.
     * @return {import("./renderer/Map.js").default|null} Renderer
     */
    getRenderer(): MapRenderer | null;
    /**
     * Get the size of this map.
     * @return {import("./size.js").Size|undefined} The size in pixels of the map in the DOM.
     * @observable
     * @api
     */
    getSize(): Size | undefined;
    /**
     * Get the view associated with this map. A view manages properties such as
     * center and resolution.
     * @return {View} The view that controls this map.
     * @observable
     * @api
     */
    getView(): View;
    /**
     * Get the element that serves as the map viewport.
     * @return {HTMLElement} Viewport.
     * @api
     */
    getViewport(): HTMLElement;
    /**
     * Get the element that serves as the container for overlays.  Elements added to
     * this container will let mousedown and touchstart events through to the map,
     * so clicks and gestures on an overlay will trigger {@link module:ol/MapBrowserEvent~MapBrowserEvent}
     * events.
     * @return {!HTMLElement} The map's overlay container.
     */
    getOverlayContainer(): HTMLElement;
    /**
     * Get the element that serves as a container for overlays that don't allow
     * event propagation. Elements added to this container won't let mousedown and
     * touchstart events through to the map, so clicks and gestures on an overlay
     * don't trigger any {@link module:ol/MapBrowserEvent~MapBrowserEvent}.
     * @return {!HTMLElement} The map's overlay container that stops events.
     */
    getOverlayContainerStopEvent(): HTMLElement;
    /**
     * @return {!Document} The document where the map is displayed.
     */
    getOwnerDocument(): Document;
    /**
     * @param {import("./Tile.js").default} tile Tile.
     * @param {string} tileSourceKey Tile source key.
     * @param {import("./coordinate.js").Coordinate} tileCenter Tile center.
     * @param {number} tileResolution Tile resolution.
     * @return {number} Tile priority.
     */
    getTilePriority(tile: Tile, tileSourceKey: string, tileCenter: Coordinate, tileResolution: number): number;
    /**
     * @param {PointerEvent|KeyboardEvent|WheelEvent} browserEvent Browser event.
     * @param {string} [type] Type.
     */
    handleBrowserEvent(browserEvent: PointerEvent | KeyboardEvent | WheelEvent, type?: string): void;
    /**
     * @param {MapBrowserEvent} mapBrowserEvent The event to handle.
     */
    handleMapBrowserEvent(mapBrowserEvent: MapBrowserEvent): void;
    /**
     * @protected
     */
    protected handlePostRender(): void;
    /**
     * @private
     */
    private handleSizeChanged_;
    /**
     * @private
     */
    private handleTargetChanged_;
    /**
     * @private
     */
    private handleTileChange_;
    /**
     * @private
     */
    private handleViewPropertyChanged_;
    /**
     * @private
     */
    private handleViewChanged_;
    /**
     * @private
     */
    private handleLayerGroupChanged_;
    /**
     * @return {boolean} Is rendered.
     */
    isRendered(): boolean;
    /**
     * Requests an immediate render in a synchronous manner.
     * @api
     */
    renderSync(): void;
    /**
     * Redraws all text after new fonts have loaded
     */
    redrawText(): void;
    /**
     * Request a map rendering (at the next animation frame).
     * @api
     */
    render(): void;
    /**
     * Remove the given control from the map.
     * @param {import("./control/Control.js").default} control Control.
     * @return {import("./control/Control.js").default|undefined} The removed control (or undefined
     *     if the control was not found).
     * @api
     */
    removeControl(control: Control): Control | undefined;
    /**
     * Remove the given interaction from the map.
     * @param {import("./interaction/Interaction.js").default} interaction Interaction to remove.
     * @return {import("./interaction/Interaction.js").default|undefined} The removed interaction (or
     *     undefined if the interaction was not found).
     * @api
     */
    removeInteraction(interaction: Interaction): Interaction | undefined;
    /**
     * Removes the given layer from the map.
     * @param {import("./layer/Base.js").default} layer Layer.
     * @return {import("./layer/Base.js").default|undefined} The removed layer (or undefined if the
     *     layer was not found).
     * @api
     */
    removeLayer(layer: BaseLayer): BaseLayer | undefined;
    /**
     * @param {import("./layer/Group.js").GroupEvent} event The layer remove event.
     * @private
     */
    private handleLayerRemove_;
    /**
     * Remove the given overlay from the map.
     * @param {import("./Overlay.js").default} overlay Overlay.
     * @return {import("./Overlay.js").default|undefined} The removed overlay (or undefined
     *     if the overlay was not found).
     * @api
     */
    removeOverlay(overlay: Overlay): Overlay | undefined;
    /**
     * @param {number} time Time.
     * @private
     */
    private renderFrame_;
    /**
     * Sets the layergroup of this map.
     * @param {LayerGroup} layerGroup A layer group containing the layers in this map.
     * @observable
     * @api
     */
    setLayerGroup(layerGroup: LayerGroup): void;
    /**
     * Set the size of this map.
     * @param {import("./size.js").Size|undefined} size The size in pixels of the map in the DOM.
     * @observable
     * @api
     */
    setSize(size: Size | undefined): void;
    /**
     * Set the target element to render this map into.
     * For accessibility (focus and keyboard events for map navigation), the `target` element must have a
     *  properly configured `tabindex` attribute. If the `target` element is inside a Shadow DOM, the
     *  `tabindex` atribute must be set on the custom element's host element.
     * @param {HTMLElement|string} [target] The Element or id of the Element
     *     that the map is rendered in.
     * @observable
     * @api
     */
    setTarget(target?: HTMLElement | string): void;
    /**
     * Set the view for this map.
     * @param {View|Promise<import("./View.js").ViewOptions>|null} view The view that controls this map.
     * It is also possible to pass a promise that resolves to options for constructing a view.  This
     * alternative allows view properties to be resolved by sources or other components that load
     * view-related metadata.
     * @observable
     * @api
     */
    setView(view: View | Promise<ViewOptions> | null): void;
    /**
     * Force a recalculation of the map viewport size.  This should be called when
     * third-party code changes the size of the map viewport.
     * @api
     */
    updateSize(): void;
    /**
     * Recomputes the viewport size and save it on the view object (if any)
     * @param {import("./size.js").Size|undefined} size The size.
     * @private
     */
    private updateViewportSize_;
}

declare class RenderEvent extends BaseEvent {
    /**
     * @param {import("./EventType.js").default} type Type.
     * @param {import("../transform.js").Transform} [inversePixelTransform] Transform for
     *     CSS pixels to rendered pixels.
     * @param {import("../Map.js").FrameState} [frameState] Frame state.
     * @param {?(CanvasRenderingContext2D|OffscreenCanvasRenderingContext2D|WebGLRenderingContext)} [context] Context.
     */
    constructor(type: any, inversePixelTransform?: Transform, frameState?: FrameState, context?: (CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D | WebGLRenderingContext) | null);
    /**
     * Transform from CSS pixels (relative to the top-left corner of the map viewport)
     * to rendered pixels on this event's `context`. Only available when a Canvas renderer is used, null otherwise.
     * @type {import("../transform.js").Transform|undefined}
     * @api
     */
    inversePixelTransform: Transform | undefined;
    /**
     * An object representing the current render frame state.
     * @type {import("../Map.js").FrameState|undefined}
     * @api
     */
    frameState: FrameState | undefined;
    /**
     * Canvas context. Not available when the event is dispatched by the map. For Canvas 2D layers,
     * the context will be the 2D rendering context.  For WebGL layers, the context will be the WebGL
     * context.
     * @type {CanvasRenderingContext2D|OffscreenCanvasRenderingContext2D|WebGLRenderingContext|undefined}
     * @api
     */
    context: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D | WebGLRenderingContext | undefined;
}
//# sourceMappingURL=Event.d.ts.map

type State$3 = {
    /**
     * Canvas context that the layer is being rendered to.
     */
    context: CanvasRenderingContext2D;
    /**
     * Feature.
     */
    feature: FeatureLike;
    /**
     * Geometry.
     */
    geometry: SimpleGeometry;
    /**
     * Pixel ratio used by the layer renderer.
     */
    pixelRatio: number;
    /**
     * Resolution that the render batch was created and optimized for.
     * This is not the view's resolution that is being rendered.
     */
    resolution: number;
    /**
     * Rotation of the rendered layer in radians.
     */
    rotation: number;
};
/**
 * A function to be used when sorting features before rendering.
 * It takes two instances of {@link module :ol/Feature~Feature} or
 * {@link module :ol/render/Feature~RenderFeature} and returns a `{number}`.
 */
type OrderFunction = (arg0: FeatureLike, arg1: FeatureLike) => number;

/**
 * Defines how symbols and text are decluttered on layers ith `declutter` set to `true`
 * **declutter**: Overlapping symbols and text are decluttered.
 * **obstacle**: Symbols and text are rendered, but serve as obstacle for subsequent attempts
 *   to place a symbol or text at the same location.
 * **none**: No decluttering is done.
 */
type DeclutterMode = "declutter" | "obstacle" | "none";
/**
 * A function that takes a {@link module :ol/Feature~Feature} and a `{number}`
 * representing the view's resolution. The function should return a
 * {@link module :ol/style/Style~Style} or an array of them. This way e.g. a
 * vector layer can be styled. If the function returns `undefined`, the
 * feature will not be rendered.
 */
type StyleFunction = (arg0: FeatureLike, arg1: number) => (Style$2 | Array<Style$2> | void);
/**
 * A {@link Style}, an array of {@link Style}, or a {@link StyleFunction}.
 */
type StyleLike = Style$2 | Array<Style$2> | StyleFunction;
/**
 * A function that takes a {@link module :ol/Feature~Feature} as argument and returns an
 * {@link module :ol/geom/Geometry~Geometry} that will be rendered and styled for the feature.
 */
type GeometryFunction = (arg0: FeatureLike) => (Geometry | RenderFeature | undefined);
/**
 * Custom renderer function. Takes two arguments:
 *
 * 1. The pixel coordinates of the geometry in GeoJSON notation.
 * 2. The {@link module :ol/render~State} of the layer renderer.
 */
type RenderFunction$1 = (arg0: (Coordinate | Array<Coordinate> | Array<Array<Coordinate>> | Array<Array<Array<Coordinate>>>), arg1: State$3) => void;
type Options$v = {
    /**
     * Feature property or geometry
     * or function returning a geometry to render for this style.
     */
    geometry?: string | Geometry | GeometryFunction | undefined;
    /**
     * Fill style.
     */
    fill?: Fill | undefined;
    /**
     * Image style.
     */
    image?: ImageStyle | undefined;
    /**
     * Custom renderer. When configured, `fill`, `stroke` and `image` will be
     * ignored, and the provided function will be called with each render frame for each geometry.
     */
    renderer?: RenderFunction$1 | undefined;
    /**
     * Custom renderer for hit detection. If provided will be used
     * in hit detection rendering.
     */
    hitDetectionRenderer?: RenderFunction$1 | undefined;
    /**
     * Stroke style.
     */
    stroke?: Stroke | undefined;
    /**
     * Text style.
     */
    text?: Text | undefined;
    /**
     * Z index.
     */
    zIndex?: number | undefined;
};
/**
 * Defines how symbols and text are decluttered on layers ith `declutter` set to `true`
 * **declutter**: Overlapping symbols and text are decluttered.
 * **obstacle**: Symbols and text are rendered, but serve as obstacle for subsequent attempts
 *   to place a symbol or text at the same location.
 * **none**: No decluttering is done.
 *
 * @typedef {"declutter"|"obstacle"|"none"} DeclutterMode
 */
/**
 * A function that takes a {@link module:ol/Feature~Feature} and a `{number}`
 * representing the view's resolution. The function should return a
 * {@link module:ol/style/Style~Style} or an array of them. This way e.g. a
 * vector layer can be styled. If the function returns `undefined`, the
 * feature will not be rendered.
 *
 * @typedef {function(import("../Feature.js").FeatureLike, number):(Style|Array<Style>|void)} StyleFunction
 */
/**
 * A {@link Style}, an array of {@link Style}, or a {@link StyleFunction}.
 * @typedef {Style|Array<Style>|StyleFunction} StyleLike
 */
/**
 * A function that takes a {@link module:ol/Feature~Feature} as argument and returns an
 * {@link module:ol/geom/Geometry~Geometry} that will be rendered and styled for the feature.
 *
 * @typedef {function(import("../Feature.js").FeatureLike):
 *     (import("../geom/Geometry.js").default|import("../render/Feature.js").default|undefined)} GeometryFunction
 */
/**
 * Custom renderer function. Takes two arguments:
 *
 * 1. The pixel coordinates of the geometry in GeoJSON notation.
 * 2. The {@link module:ol/render~State} of the layer renderer.
 *
 * @typedef {function((import("../coordinate.js").Coordinate|Array<import("../coordinate.js").Coordinate>|Array<Array<import("../coordinate.js").Coordinate>>|Array<Array<Array<import("../coordinate.js").Coordinate>>>),import("../render.js").State): void} RenderFunction
 */
/**
 * @typedef {Object} Options
 * @property {string|import("../geom/Geometry.js").default|GeometryFunction} [geometry] Feature property or geometry
 * or function returning a geometry to render for this style.
 * @property {import("./Fill.js").default} [fill] Fill style.
 * @property {import("./Image.js").default} [image] Image style.
 * @property {RenderFunction} [renderer] Custom renderer. When configured, `fill`, `stroke` and `image` will be
 * ignored, and the provided function will be called with each render frame for each geometry.
 * @property {RenderFunction} [hitDetectionRenderer] Custom renderer for hit detection. If provided will be used
 * in hit detection rendering.
 * @property {import("./Stroke.js").default} [stroke] Stroke style.
 * @property {import("./Text.js").default} [text] Text style.
 * @property {number} [zIndex] Z index.
 */
/**
 * @classdesc
 * Container for vector feature rendering styles. Any changes made to the style
 * or its children through `set*()` methods will not take effect until the
 * feature or layer that uses the style is re-rendered.
 *
 * ## Feature styles
 *
 * If no style is defined, the following default style is used:
 * ```js
 *  import {Circle, Fill, Stroke, Style} from 'ol/style.js';
 *
 *  const fill = new Fill({
 *    color: 'rgba(255,255,255,0.4)',
 *  });
 *  const stroke = new Stroke({
 *    color: '#3399CC',
 *    width: 1.25,
 *  });
 *  const styles = [
 *    new Style({
 *      image: new Circle({
 *        fill: fill,
 *        stroke: stroke,
 *        radius: 5,
 *      }),
 *      fill: fill,
 *      stroke: stroke,
 *    }),
 *  ];
 * ```
 *
 * A separate editing style has the following defaults:
 * ```js
 *  import {Circle, Fill, Stroke, Style} from 'ol/style.js';
 *
 *  const styles = {};
 *  const white = [255, 255, 255, 1];
 *  const blue = [0, 153, 255, 1];
 *  const width = 3;
 *  styles['Polygon'] = [
 *    new Style({
 *      fill: new Fill({
 *        color: [255, 255, 255, 0.5],
 *      }),
 *    }),
 *  ];
 *  styles['MultiPolygon'] =
 *      styles['Polygon'];
 *  styles['LineString'] = [
 *    new Style({
 *      stroke: new Stroke({
 *        color: white,
 *        width: width + 2,
 *      }),
 *    }),
 *    new Style({
 *      stroke: new Stroke({
 *        color: blue,
 *        width: width,
 *      }),
 *    }),
 *  ];
 *  styles['MultiLineString'] = styles['LineString'];
 *
 *  styles['Circle'] = styles['Polygon'].concat(
 *    styles['LineString']
 *  );
 *
 *  styles['Point'] = [
 *    new Style({
 *      image: new Circle({
 *        radius: width * 2,
 *        fill: new Fill({
 *          color: blue,
 *        }),
 *        stroke: new Stroke({
 *          color: white,
 *          width: width / 2,
 *        }),
 *      }),
 *      zIndex: Infinity,
 *    }),
 *  ];
 *  styles['MultiPoint'] =
 *      styles['Point'];
 *  styles['GeometryCollection'] =
 *      styles['Polygon'].concat(
 *          styles['LineString'],
 *          styles['Point']
 *      );
 * ```
 *
 * @api
 */
declare class Style$2 {
    /**
     * @param {Options} [options] Style options.
     */
    constructor(options?: Options$v);
    /**
     * @private
     * @type {string|import("../geom/Geometry.js").default|GeometryFunction|null}
     */
    private geometry_;
    /**
     * @private
     * @type {!GeometryFunction}
     */
    private geometryFunction_;
    /**
     * @private
     * @type {import("./Fill.js").default|null}
     */
    private fill_;
    /**
     * @private
     * @type {import("./Image.js").default|null}
     */
    private image_;
    /**
     * @private
     * @type {RenderFunction|null}
     */
    private renderer_;
    /**
     * @private
     * @type {RenderFunction|null}
     */
    private hitDetectionRenderer_;
    /**
     * @private
     * @type {import("./Stroke.js").default|null}
     */
    private stroke_;
    /**
     * @private
     * @type {import("./Text.js").default|null}
     */
    private text_;
    /**
     * @private
     * @type {number|undefined}
     */
    private zIndex_;
    /**
     * Clones the style.
     * @return {Style} The cloned style.
     * @api
     */
    clone(): Style$2;
    /**
     * Get the custom renderer function that was configured with
     * {@link #setRenderer} or the `renderer` constructor option.
     * @return {RenderFunction|null} Custom renderer function.
     * @api
     */
    getRenderer(): RenderFunction$1 | null;
    /**
     * Sets a custom renderer function for this style. When set, `fill`, `stroke`
     * and `image` options of the style will be ignored.
     * @param {RenderFunction|null} renderer Custom renderer function.
     * @api
     */
    setRenderer(renderer: RenderFunction$1 | null): void;
    /**
     * Sets a custom renderer function for this style used
     * in hit detection.
     * @param {RenderFunction|null} renderer Custom renderer function.
     * @api
     */
    setHitDetectionRenderer(renderer: RenderFunction$1 | null): void;
    /**
     * Get the custom renderer function that was configured with
     * {@link #setHitDetectionRenderer} or the `hitDetectionRenderer` constructor option.
     * @return {RenderFunction|null} Custom renderer function.
     * @api
     */
    getHitDetectionRenderer(): RenderFunction$1 | null;
    /**
     * Get the geometry to be rendered.
     * @return {string|import("../geom/Geometry.js").default|GeometryFunction|null}
     * Feature property or geometry or function that returns the geometry that will
     * be rendered with this style.
     * @api
     */
    getGeometry(): string | Geometry | GeometryFunction | null;
    /**
     * Get the function used to generate a geometry for rendering.
     * @return {!GeometryFunction} Function that is called with a feature
     * and returns the geometry to render instead of the feature's geometry.
     * @api
     */
    getGeometryFunction(): GeometryFunction;
    /**
     * Get the fill style.
     * @return {import("./Fill.js").default|null} Fill style.
     * @api
     */
    getFill(): Fill | null;
    /**
     * Set the fill style.
     * @param {import("./Fill.js").default|null} fill Fill style.
     * @api
     */
    setFill(fill: Fill | null): void;
    /**
     * Get the image style.
     * @return {import("./Image.js").default|null} Image style.
     * @api
     */
    getImage(): ImageStyle | null;
    /**
     * Set the image style.
     * @param {import("./Image.js").default} image Image style.
     * @api
     */
    setImage(image: ImageStyle): void;
    /**
     * Get the stroke style.
     * @return {import("./Stroke.js").default|null} Stroke style.
     * @api
     */
    getStroke(): Stroke | null;
    /**
     * Set the stroke style.
     * @param {import("./Stroke.js").default|null} stroke Stroke style.
     * @api
     */
    setStroke(stroke: Stroke | null): void;
    /**
     * Get the text style.
     * @return {import("./Text.js").default|null} Text style.
     * @api
     */
    getText(): Text | null;
    /**
     * Set the text style.
     * @param {import("./Text.js").default} text Text style.
     * @api
     */
    setText(text: Text): void;
    /**
     * Get the z-index for the style.
     * @return {number|undefined} ZIndex.
     * @api
     */
    getZIndex(): number | undefined;
    /**
     * Set a geometry that is rendered instead of the feature's geometry.
     *
     * @param {string|import("../geom/Geometry.js").default|GeometryFunction|null} geometry
     *     Feature property or geometry or function returning a geometry to render
     *     for this style.
     * @api
     */
    setGeometry(geometry: string | Geometry | GeometryFunction | null): void;
    /**
     * Set the z-index.
     *
     * @param {number|undefined} zIndex ZIndex.
     * @api
     */
    setZIndex(zIndex: number | undefined): void;
}

/**
 * The geometry type.  One of `'Point'`, `'LineString'`, `'LinearRing'`,
 * `'Polygon'`, `'MultiPoint'` or 'MultiLineString'`.
 */
type Type$4 = "Point" | "LineString" | "LinearRing" | "Polygon" | "MultiPoint" | "MultiLineString";
/**
 * Lightweight, read-only, {@link module:ol/Feature~Feature} and {@link module:ol/geom/Geometry~Geometry} like
 * structure, optimized for vector tile rendering and styling. Geometry access
 * through the API is limited to getting the type and extent of the geometry.
 */
declare class RenderFeature {
    /**
     * @param {Type} type Geometry type.
     * @param {Array<number>} flatCoordinates Flat coordinates. These always need
     *     to be right-handed for polygons.
     * @param {Array<number>} ends Ends.
     * @param {number} stride Stride.
     * @param {Object<string, *>} properties Properties.
     * @param {number|string|undefined} id Feature id.
     */
    constructor(type: Type$4, flatCoordinates: Array<number>, ends: Array<number>, stride: number, properties: {
        [x: string]: any;
    }, id: number | string | undefined);
    /**
     * @type {import("../style/Style.js").StyleFunction|undefined}
     */
    styleFunction: StyleFunction | undefined;
    /**
     * @private
     * @type {import("../extent.js").Extent|undefined}
     */
    private extent_;
    /**
     * @private
     * @type {number|string|undefined}
     */
    private id_;
    /**
     * @private
     * @type {Type}
     */
    private type_;
    /**
     * @private
     * @type {Array<number>}
     */
    private flatCoordinates_;
    /**
     * @private
     * @type {Array<number>}
     */
    private flatInteriorPoints_;
    /**
     * @private
     * @type {Array<number>}
     */
    private flatMidpoints_;
    /**
     * @private
     * @type {Array<number>|null}
     */
    private ends_;
    /**
     * @private
     * @type {Object<string, *>}
     */
    private properties_;
    /**
     * @private
     * @type {number}
     */
    private squaredTolerance_;
    /**
     * @private
     * @type {number}
     */
    private stride_;
    /**
     * @private
     * @type {RenderFeature}
     */
    private simplifiedGeometry_;
    /**
     * Get a feature property by its key.
     * @param {string} key Key
     * @return {*} Value for the requested key.
     * @api
     */
    get(key: string): any;
    /**
     * Get the extent of this feature's geometry.
     * @return {import("../extent.js").Extent} Extent.
     * @api
     */
    getExtent(): Extent;
    /**
     * @return {Array<number>} Flat interior points.
     */
    getFlatInteriorPoint(): Array<number>;
    /**
     * @return {Array<number>} Flat interior points.
     */
    getFlatInteriorPoints(): Array<number>;
    /**
     * @return {Array<number>} Flat midpoint.
     */
    getFlatMidpoint(): Array<number>;
    /**
     * @return {Array<number>} Flat midpoints.
     */
    getFlatMidpoints(): Array<number>;
    /**
     * Get the feature identifier.  This is a stable identifier for the feature and
     * is set when reading data from a remote source.
     * @return {number|string|undefined} Id.
     * @api
     */
    getId(): number | string | undefined;
    /**
     * @return {Array<number>} Flat coordinates.
     */
    getOrientedFlatCoordinates(): Array<number>;
    /**
     * For API compatibility with {@link module:ol/Feature~Feature}, this method is useful when
     * determining the geometry type in style function (see {@link #getType}).
     * @return {RenderFeature} Feature.
     * @api
     */
    getGeometry(): RenderFeature;
    /**
     * @param {number} squaredTolerance Squared tolerance.
     * @return {RenderFeature} Simplified geometry.
     */
    getSimplifiedGeometry(squaredTolerance: number): RenderFeature;
    /**
     * Get a transformed and simplified version of the geometry.
     * @param {number} squaredTolerance Squared tolerance.
     * @param {import("../proj.js").TransformFunction} [transform] Optional transform function.
     * @return {RenderFeature} Simplified geometry.
     */
    simplifyTransformed(squaredTolerance: number, transform?: TransformFunction): RenderFeature;
    /**
     * Get the feature properties.
     * @return {Object<string, *>} Feature properties.
     * @api
     */
    getProperties(): {
        [x: string]: any;
    };
    /**
     * Get an object of all property names and values.  This has the same behavior as getProperties,
     * but is here to conform with the {@link module:ol/Feature~Feature} interface.
     * @return {Object<string, *>?} Object.
     */
    getPropertiesInternal(): {
        [x: string]: any;
    } | null;
    /**
     * @return {number} Stride.
     */
    getStride(): number;
    /**
     * @return {import('../style/Style.js').StyleFunction|undefined} Style
     */
    getStyleFunction(): StyleFunction | undefined;
    /**
     * Get the type of this feature's geometry.
     * @return {Type} Geometry type.
     * @api
     */
    getType(): Type$4;
    /**
     * Transform geometry coordinates from tile pixel space to projected.
     *
     * @param {import("../proj.js").ProjectionLike} projection The data projection
     */
    transform(projection: ProjectionLike): void;
    /**
     * Apply a transform function to the coordinates of the geometry.
     * The geometry is modified in place.
     * If you do not want the geometry modified in place, first `clone()` it and
     * then use this function on the clone.
     * @param {import("../proj.js").TransformFunction} transformFn Transform function.
     */
    applyTransform(transformFn: TransformFunction): void;
    /**
     * @return {RenderFeature} A cloned render feature.
     */
    clone(): RenderFeature;
    /**
     * @return {Array<number>|null} Ends.
     */
    getEnds(): Array<number> | null;
    /**
     * Add transform and resolution based geometry simplification to this instance.
     * @return {RenderFeature} This render feature.
     */
    enableSimplifyTransformed(): RenderFeature;
    /**
     * @return {Array<number>} Flat coordinates.
     */
    getFlatCoordinates: () => Array<number>;
}

type FeatureLike = Feature$1 | RenderFeature;
/**
 * *
 */
type FeatureOnSignature<Return> = OnSignature<EventTypes, BaseEvent, Return> & OnSignature<Types$2 | "change:geometry", ObjectEvent, Return> & CombinedOnSignature<EventTypes | Types$2 | "change:geometry", Return>;
/**
 * *
 */
type ObjectWithGeometry<Geometry extends Geometry = Geometry> = {
    [x: string]: any;
} & {
    geometry?: Geometry;
};
/**
 * @typedef {typeof Feature|typeof import("./render/Feature.js").default} FeatureClass
 */
/**
 * @typedef {Feature|import("./render/Feature.js").default} FeatureLike
 */
/***
 * @template Return
 * @typedef {import("./Observable").OnSignature<import("./Observable").EventTypes, import("./events/Event.js").default, Return> &
 *   import("./Observable").OnSignature<import("./ObjectEventType").Types|'change:geometry', import("./Object").ObjectEvent, Return> &
 *   import("./Observable").CombinedOnSignature<import("./Observable").EventTypes|import("./ObjectEventType").Types
 *     |'change:geometry', Return>} FeatureOnSignature
 */
/***
 * @template {import("./geom/Geometry.js").default} [Geometry=import("./geom/Geometry.js").default]
 * @typedef {Object<string, *> & { geometry?: Geometry }} ObjectWithGeometry
 */
/**
 * @classdesc
 * A vector object for geographic features with a geometry and other
 * attribute properties, similar to the features in vector file formats like
 * GeoJSON.
 *
 * Features can be styled individually with `setStyle`; otherwise they use the
 * style of their vector layer.
 *
 * Note that attribute properties are set as {@link module:ol/Object~BaseObject} properties on
 * the feature object, so they are observable, and have get/set accessors.
 *
 * Typically, a feature has a single geometry property. You can set the
 * geometry using the `setGeometry` method and get it with `getGeometry`.
 * It is possible to store more than one geometry on a feature using attribute
 * properties. By default, the geometry used for rendering is identified by
 * the property name `geometry`. If you want to use another geometry property
 * for rendering, use the `setGeometryName` method to change the attribute
 * property associated with the geometry for the feature.  For example:
 *
 * ```js
 *
 * import Feature from 'ol/Feature.js';
 * import Polygon from 'ol/geom/Polygon.js';
 * import Point from 'ol/geom/Point.js';
 *
 * const feature = new Feature({
 *   geometry: new Polygon(polyCoords),
 *   labelPoint: new Point(labelCoords),
 *   name: 'My Polygon',
 * });
 *
 * // get the polygon geometry
 * const poly = feature.getGeometry();
 *
 * // Render the feature as a point using the coordinates from labelPoint
 * feature.setGeometryName('labelPoint');
 *
 * // get the point geometry
 * const point = feature.getGeometry();
 * ```
 *
 * @api
 * @template {import("./geom/Geometry.js").default} [Geometry=import("./geom/Geometry.js").default]
 */
declare class Feature$1<Geometry extends Geometry = Geometry> extends BaseObject {
    /**
     * @param {Geometry|ObjectWithGeometry<Geometry>} [geometryOrProperties]
     *     You may pass a Geometry object directly, or an object literal containing
     *     properties. If you pass an object literal, you may include a Geometry
     *     associated with a `geometry` key.
     */
    constructor(geometryOrProperties?: Geometry | ObjectWithGeometry<Geometry>);
    /***
     * @type {FeatureOnSignature<import("./events").EventsKey>}
     */
    on: FeatureOnSignature<EventsKey>;
    /***
     * @type {FeatureOnSignature<import("./events").EventsKey>}
     */
    once: FeatureOnSignature<EventsKey>;
    /***
     * @type {FeatureOnSignature<void>}
     */
    un: FeatureOnSignature<void>;
    /**
     * @private
     * @type {number|string|undefined}
     */
    private id_;
    /**
     * @type {string}
     * @private
     */
    private geometryName_;
    /**
     * User provided style.
     * @private
     * @type {import("./style/Style.js").StyleLike}
     */
    private style_;
    /**
     * @private
     * @type {import("./style/Style.js").StyleFunction|undefined}
     */
    private styleFunction_;
    /**
     * @private
     * @type {?import("./events.js").EventsKey}
     */
    private geometryChangeKey_;
    /**
     * Clone this feature. If the original feature has a geometry it
     * is also cloned. The feature id is not set in the clone.
     * @return {Feature<Geometry>} The clone.
     * @api
     */
    clone(): Feature$1<Geometry>;
    /**
     * Get the feature's default geometry.  A feature may have any number of named
     * geometries.  The "default" geometry (the one that is rendered by default) is
     * set when calling {@link module:ol/Feature~Feature#setGeometry}.
     * @return {Geometry|undefined} The default geometry for the feature.
     * @api
     * @observable
     */
    getGeometry(): Geometry | undefined;
    /**
     * Get the feature identifier.  This is a stable identifier for the feature and
     * is either set when reading data from a remote source or set explicitly by
     * calling {@link module:ol/Feature~Feature#setId}.
     * @return {number|string|undefined} Id.
     * @api
     */
    getId(): number | string | undefined;
    /**
     * Get the name of the feature's default geometry.  By default, the default
     * geometry is named `geometry`.
     * @return {string} Get the property name associated with the default geometry
     *     for this feature.
     * @api
     */
    getGeometryName(): string;
    /**
     * Get the feature's style. Will return what was provided to the
     * {@link module:ol/Feature~Feature#setStyle} method.
     * @return {import("./style/Style.js").StyleLike|undefined} The feature style.
     * @api
     */
    getStyle(): StyleLike | undefined;
    /**
     * Get the feature's style function.
     * @return {import("./style/Style.js").StyleFunction|undefined} Return a function
     * representing the current style of this feature.
     * @api
     */
    getStyleFunction(): StyleFunction | undefined;
    /**
     * @private
     */
    private handleGeometryChange_;
    /**
     * @private
     */
    private handleGeometryChanged_;
    /**
     * Set the default geometry for the feature.  This will update the property
     * with the name returned by {@link module:ol/Feature~Feature#getGeometryName}.
     * @param {Geometry|undefined} geometry The new geometry.
     * @api
     * @observable
     */
    setGeometry(geometry: Geometry | undefined): void;
    /**
     * Set the style for the feature to override the layer style.  This can be a
     * single style object, an array of styles, or a function that takes a
     * resolution and returns an array of styles. To unset the feature style, call
     * `setStyle()` without arguments or a falsey value.
     * @param {import("./style/Style.js").StyleLike} [style] Style for this feature.
     * @api
     * @fires module:ol/events/Event~BaseEvent#event:change
     */
    setStyle(style?: StyleLike): void;
    /**
     * Set the feature id.  The feature id is considered stable and may be used when
     * requesting features or comparing identifiers returned from a remote source.
     * The feature id can be used with the
     * {@link module:ol/source/Vector~VectorSource#getFeatureById} method.
     * @param {number|string|undefined} id The feature id.
     * @api
     * @fires module:ol/events/Event~BaseEvent#event:change
     */
    setId(id: number | string | undefined): void;
    /**
     * Set the property name to be used when getting the feature's default geometry.
     * When calling {@link module:ol/Feature~Feature#getGeometry}, the value of the property with
     * this name will be returned.
     * @param {string} name The property name of the default geometry.
     * @api
     */
    setGeometryName(name: string): void;
}

type ResolutionLike = number | Array<number>;

type ImageObject = {
    /**
     * Extent, if different from the requested one.
     */
    extent?: Extent | undefined;
    /**
     * Resolution, if different from the requested one.
     * When x and y resolution are different, use the array type (`[xResolution, yResolution]`).
     */
    resolution?: ResolutionLike | undefined;
    /**
     * Pixel ratio, if different from the requested one.
     */
    pixelRatio?: number | undefined;
    /**
     * Image.
     */
    image: ImageLike;
};
/**
 * Loader function used for image sources. Receives extent, resolution and pixel ratio as arguments.
 * For images that cover any extent and resolution (static images), the loader function should not accept
 * any arguments. The function returns an {@link import ("./DataTile.js").ImageLike image}, an
 * {@link import ("./Image.js").ImageObject image object}, or a promise for the same.
 * For loaders that generate images, the promise should not resolve until the image is loaded.
 * If the returned image does not match the extent, resolution or pixel ratio passed to the loader,
 * it has to return an {@link import ("./Image.js").ImageObject image object} with the `image` and the
 * correct `extent`, `resolution` and `pixelRatio`.
 */
type Loader$2 = (arg0: Extent, arg1: number, arg2: number, arg3: ((arg0: HTMLImageElement, arg1: string) => void) | undefined) => ImageLike | ImageObject | Promise<ImageLike | ImageObject>;
/**
 * A function that takes an {@link module:ol/Image~ImageWrapper} for the image and a
 * `{string}` for the src as arguments. It is supposed to make it so the
 * underlying image {@link module:ol/Image~ImageWrapper#getImage} is assigned the
 * content specified by the src. If not specified, the default is
 *
 *     function(image, src) {
 *       image.getImage().src = src;
 *     }
 *
 * Providing a custom `imageLoadFunction` can be useful to load images with
 * post requests or - in general - through XHR requests, where the src of the
 * image element would be set to a data URI when the content is loaded.
 *
 * @typedef {function(import("./Image.js").default, string): void} LoadFunction
 * @api
 */
/**
 * @typedef {Object} ImageObject
 * @property {import("./extent.js").Extent} [extent] Extent, if different from the requested one.
 * @property {import("./resolution.js").ResolutionLike} [resolution] Resolution, if different from the requested one.
 * When x and y resolution are different, use the array type (`[xResolution, yResolution]`).
 * @property {number} [pixelRatio] Pixel ratio, if different from the requested one.
 * @property {import('./DataTile.js').ImageLike} image Image.
 */
/**
 * Loader function used for image sources. Receives extent, resolution and pixel ratio as arguments.
 * For images that cover any extent and resolution (static images), the loader function should not accept
 * any arguments. The function returns an {@link import("./DataTile.js").ImageLike image}, an
 * {@link import("./Image.js").ImageObject image object}, or a promise for the same.
 * For loaders that generate images, the promise should not resolve until the image is loaded.
 * If the returned image does not match the extent, resolution or pixel ratio passed to the loader,
 * it has to return an {@link import("./Image.js").ImageObject image object} with the `image` and the
 * correct `extent`, `resolution` and `pixelRatio`.
 *
 * @typedef {function(import("./extent.js").Extent, number, number, (function(HTMLImageElement, string): void)=): import("./DataTile.js").ImageLike|ImageObject|Promise<import("./DataTile.js").ImageLike|ImageObject>} Loader
 * @api
 */
/**
 * Loader function used for image sources. Receives extent, resolution and pixel ratio as arguments.
 * The function returns a promise for an  {@link import("./Image.js").ImageObject image object}.
 *
 * @typedef {function(import("./extent.js").Extent, number, number, (function(HTMLImageElement, string): void)=): Promise<import("./DataTile.js").ImageLike|ImageObject>} ImageObjectPromiseLoader
 */
declare class ImageWrapper extends Target {
    /**
     * @param {import("./extent.js").Extent} extent Extent.
     * @param {number|Array<number>|undefined} resolution Resolution. If provided as array, x and y
     * resolution will be assumed.
     * @param {number} pixelRatio Pixel ratio.
     * @param {import("./ImageState.js").default|Loader} stateOrLoader State.
     */
    constructor(extent: Extent, resolution: number | Array<number> | undefined, pixelRatio: number, stateOrLoader: any | Loader$2);
    /**
     * @protected
     * @type {import("./extent.js").Extent}
     */
    protected extent: Extent;
    /**
     * @private
     * @type {number}
     */
    private pixelRatio_;
    /**
     * @protected
     * @type {number|Array<number>|undefined}
     */
    protected resolution: number | Array<number> | undefined;
    /**
     * @protected
     * @type {import("./ImageState.js").default}
     */
    protected state: any;
    /**
     * @private
     * @type {import('./DataTile.js').ImageLike|null}
     */
    private image_;
    /**
     * @protected
     * @type {Loader|null}
     */
    protected loader: Loader$2 | null;
    /**
     * @protected
     */
    protected changed(): void;
    /**
     * @return {import("./extent.js").Extent} Extent.
     */
    getExtent(): Extent;
    /**
     * @return {import('./DataTile.js').ImageLike} Image.
     */
    getImage(): ImageLike;
    /**
     * @return {number} PixelRatio.
     */
    getPixelRatio(): number;
    /**
     * @return {number|Array<number>} Resolution.
     */
    getResolution(): number | Array<number>;
    /**
     * @return {import("./ImageState.js").default} State.
     */
    getState(): any;
    /**
     * Load not yet loaded URI.
     */
    load(): void;
    /**
     * @param {import('./DataTile.js').ImageLike} image The image.
     */
    setImage(image: ImageLike): void;
    /**
     * @param {number|Array<number>} resolution Resolution.
     */
    setResolution(resolution: number | Array<number>): void;
}

/**
 * @template {import("../layer/Layer.js").default} LayerType
 */
declare class LayerRenderer<LayerType extends Layer> extends Observable {
    /**
     * @param {LayerType} layer Layer.
     */
    constructor(layer: LayerType);
    /**
     * The renderer is initialized and ready to render.
     * @type {boolean}
     */
    ready: boolean;
    /** @private */
    private boundHandleImageChange_;
    /**
     * @private
     * @type {LayerType}
     */
    private layer_;
    /**
     * @type {Array<string>}
     * @private
     */
    private staleKeys_;
    /**
     * @type {number}
     * @protected
     */
    protected maxStaleKeys: number;
    /**
     * @return {Array<string>} Get the list of stale keys.
     */
    getStaleKeys(): Array<string>;
    /**
     * @param {string} key The new stale key.
     */
    prependStaleKey(key: string): void;
    /**
     * Asynchronous layer level hit detection.
     * @param {import("../pixel.js").Pixel} pixel Pixel.
     * @return {Promise<Array<import("../Feature").FeatureLike>>} Promise that resolves with
     * an array of features.
     */
    getFeatures(pixel: Pixel): Promise<Array<FeatureLike>>;
    /**
     * @param {import("../pixel.js").Pixel} pixel Pixel.
     * @return {Uint8ClampedArray|Uint8Array|Float32Array|DataView|null} Pixel data.
     */
    getData(pixel: Pixel): Uint8ClampedArray | Uint8Array | Float32Array | DataView | null;
    /**
     * Determine whether render should be called.
     * @abstract
     * @param {import("../Map.js").FrameState} frameState Frame state.
     * @return {boolean} Layer is ready to be rendered.
     */
    prepareFrame(frameState: FrameState): boolean;
    /**
     * Render the layer.
     * @abstract
     * @param {import("../Map.js").FrameState} frameState Frame state.
     * @param {HTMLElement|null} target Target that may be used to render content to.
     * @return {HTMLElement} The rendered element.
     */
    renderFrame(frameState: FrameState, target: HTMLElement | null): HTMLElement;
    /**
     * @abstract
     * @param {import("../coordinate.js").Coordinate} coordinate Coordinate.
     * @param {import("../Map.js").FrameState} frameState Frame state.
     * @param {number} hitTolerance Hit tolerance in pixels.
     * @param {import("./vector.js").FeatureCallback<T>} callback Feature callback.
     * @param {Array<import("./Map.js").HitMatch<T>>} matches The hit detected matches with tolerance.
     * @return {T|undefined} Callback result.
     * @template T
     */
    forEachFeatureAtCoordinate<T>(coordinate: Coordinate, frameState: FrameState, hitTolerance: number, callback: FeatureCallback<T>, matches: Array<HitMatch<T>>): T | undefined;
    /**
     * @return {LayerType} Layer.
     */
    getLayer(): LayerType;
    /**
     * Perform action necessary to get the layer rendered after new fonts have loaded
     * @abstract
     */
    handleFontsChanged(): void;
    /**
     * Handle changes in image state.
     * @param {import("../events/Event.js").default} event Image change event.
     * @private
     */
    private handleImageChange_;
    /**
     * Load the image if not already loaded, and register the image change
     * listener if needed.
     * @param {import("../Image.js").default} image Image.
     * @return {boolean} `true` if the image is already loaded, `false` otherwise.
     * @protected
     */
    protected loadImage(image: ImageWrapper): boolean;
    /**
     * @protected
     */
    protected renderIfReadyAndVisible(): void;
    /**
     * @param {import("../Map.js").FrameState} frameState Frame state.
     */
    renderDeferred(frameState: FrameState): void;
}
//# sourceMappingURL=Layer.d.ts.map

type RenderFunction = (arg0: FrameState) => HTMLElement;
type LayerEventType = "sourceready" | "change:source";
/**
 * *
 */
type LayerOnSignature<Return> = OnSignature<EventTypes, BaseEvent, Return> & OnSignature<BaseLayerObjectEventTypes | LayerEventType, ObjectEvent, Return> & OnSignature<LayerRenderEventTypes, RenderEvent, Return> & CombinedOnSignature<EventTypes | BaseLayerObjectEventTypes | LayerEventType | LayerRenderEventTypes, Return>;
type Options$u<SourceType extends Source = Source> = {
    /**
     * A CSS class name to set to the layer element.
     */
    className?: string | undefined;
    /**
     * Opacity (0, 1).
     */
    opacity?: number | undefined;
    /**
     * Visibility.
     */
    visible?: boolean | undefined;
    /**
     * The bounding extent for layer rendering.  The layer will not be
     * rendered outside of this extent.
     */
    extent?: Extent | undefined;
    /**
     * The z-index for layer rendering.  At rendering time, the layers
     * will be ordered, first by Z-index and then by position. When `undefined`, a `zIndex` of 0 is assumed
     * for layers that are added to the map's `layers` collection, or `Infinity` when the layer's `setMap()`
     * method was used.
     */
    zIndex?: number | undefined;
    /**
     * The minimum resolution (inclusive) at which this layer will be
     * visible.
     */
    minResolution?: number | undefined;
    /**
     * The maximum resolution (exclusive) below which this layer will
     * be visible.
     */
    maxResolution?: number | undefined;
    /**
     * The minimum view zoom level (exclusive) above which this layer will be
     * visible.
     */
    minZoom?: number | undefined;
    /**
     * The maximum view zoom level (inclusive) at which this layer will
     * be visible.
     */
    maxZoom?: number | undefined;
    /**
     * Source for this layer.  If not provided to the constructor,
     * the source can be set by calling {@link module :ol/layer/Layer~Layer#setSource layer.setSource(source)} after
     * construction.
     */
    source?: SourceType | undefined;
    /**
     * Map.
     */
    map?: Map | null | undefined;
    /**
     * Render function. Takes the frame state as input and is expected to return an
     * HTML element. Will overwrite the default rendering for the layer.
     */
    render?: RenderFunction | undefined;
    /**
     * Arbitrary observable properties. Can be accessed with `#get()` and `#set()`.
     */
    properties?: {
        [x: string]: any;
    } | undefined;
};
type State$2 = {
    /**
     * Layer.
     */
    layer: Layer;
    /**
     * Opacity, the value is rounded to two digits to appear after the decimal point.
     */
    opacity: number;
    /**
     * Visible.
     */
    visible: boolean;
    /**
     * Managed.
     */
    managed: boolean;
    /**
     * Extent.
     */
    extent?: Extent | undefined;
    /**
     * ZIndex.
     */
    zIndex: number;
    /**
     * Maximum resolution.
     */
    maxResolution: number;
    /**
     * Minimum resolution.
     */
    minResolution: number;
    /**
     * Minimum zoom.
     */
    minZoom: number;
    /**
     * Maximum zoom.
     */
    maxZoom: number;
};
/**
 * @typedef {function(import("../Map.js").FrameState):HTMLElement} RenderFunction
 */
/**
 * @typedef {'sourceready'|'change:source'} LayerEventType
 */
/***
 * @template Return
 * @typedef {import("../Observable").OnSignature<import("../Observable").EventTypes, import("../events/Event.js").default, Return> &
 *   import("../Observable").OnSignature<import("./Base").BaseLayerObjectEventTypes|
 *     LayerEventType, import("../Object").ObjectEvent, Return> &
 *   import("../Observable").OnSignature<import("../render/EventType").LayerRenderEventTypes, import("../render/Event").default, Return> &
 *   import("../Observable").CombinedOnSignature<import("../Observable").EventTypes|import("./Base").BaseLayerObjectEventTypes|LayerEventType|
 *     import("../render/EventType").LayerRenderEventTypes, Return>} LayerOnSignature
 */
/**
 * @template {import("../source/Source.js").default} [SourceType=import("../source/Source.js").default]
 * @typedef {Object} Options
 * @property {string} [className='ol-layer'] A CSS class name to set to the layer element.
 * @property {number} [opacity=1] Opacity (0, 1).
 * @property {boolean} [visible=true] Visibility.
 * @property {import("../extent.js").Extent} [extent] The bounding extent for layer rendering.  The layer will not be
 * rendered outside of this extent.
 * @property {number} [zIndex] The z-index for layer rendering.  At rendering time, the layers
 * will be ordered, first by Z-index and then by position. When `undefined`, a `zIndex` of 0 is assumed
 * for layers that are added to the map's `layers` collection, or `Infinity` when the layer's `setMap()`
 * method was used.
 * @property {number} [minResolution] The minimum resolution (inclusive) at which this layer will be
 * visible.
 * @property {number} [maxResolution] The maximum resolution (exclusive) below which this layer will
 * be visible.
 * @property {number} [minZoom] The minimum view zoom level (exclusive) above which this layer will be
 * visible.
 * @property {number} [maxZoom] The maximum view zoom level (inclusive) at which this layer will
 * be visible.
 * @property {SourceType} [source] Source for this layer.  If not provided to the constructor,
 * the source can be set by calling {@link module:ol/layer/Layer~Layer#setSource layer.setSource(source)} after
 * construction.
 * @property {import("../Map.js").default|null} [map] Map.
 * @property {RenderFunction} [render] Render function. Takes the frame state as input and is expected to return an
 * HTML element. Will overwrite the default rendering for the layer.
 * @property {Object<string, *>} [properties] Arbitrary observable properties. Can be accessed with `#get()` and `#set()`.
 */
/**
 * @typedef {Object} State
 * @property {import("./Layer.js").default} layer Layer.
 * @property {number} opacity Opacity, the value is rounded to two digits to appear after the decimal point.
 * @property {boolean} visible Visible.
 * @property {boolean} managed Managed.
 * @property {import("../extent.js").Extent} [extent] Extent.
 * @property {number} zIndex ZIndex.
 * @property {number} maxResolution Maximum resolution.
 * @property {number} minResolution Minimum resolution.
 * @property {number} minZoom Minimum zoom.
 * @property {number} maxZoom Maximum zoom.
 */
/**
 * @classdesc
 * Base class from which all layer types are derived. This should only be instantiated
 * in the case where a custom layer is added to the map with a custom `render` function.
 * Such a function can be specified in the `options` object, and is expected to return an HTML element.
 *
 * A visual representation of raster or vector map data.
 * Layers group together those properties that pertain to how the data is to be
 * displayed, irrespective of the source of that data.
 *
 * Layers are usually added to a map with [map.addLayer()]{@link import("../Map.js").default#addLayer}.
 * Components like {@link module:ol/interaction/Draw~Draw} use unmanaged layers
 * internally. These unmanaged layers are associated with the map using
 * [layer.setMap()]{@link module:ol/layer/Layer~Layer#setMap} instead.
 *
 * A generic `change` event is fired when the state of the source changes.
 * A `sourceready` event is fired when the layer's source is ready.
 *
 * @fires import("../render/Event.js").RenderEvent#prerender
 * @fires import("../render/Event.js").RenderEvent#postrender
 * @fires import("../events/Event.js").BaseEvent#sourceready
 *
 * @template {import("../source/Source.js").default} [SourceType=import("../source/Source.js").default]
 * @template {import("../renderer/Layer.js").default} [RendererType=import("../renderer/Layer.js").default]
 * @api
 */
declare class Layer<SourceType extends Source = Source, RendererType extends LayerRenderer<any> = LayerRenderer<any>> extends BaseLayer {
    /**
     * @param {Options<SourceType>} options Layer options.
     */
    constructor(options: Options$u<SourceType>);
    /***
     * @type {LayerOnSignature<import("../events").EventsKey>}
     */
    on: LayerOnSignature<EventsKey>;
    /***
     * @type {LayerOnSignature<import("../events").EventsKey>}
     */
    once: LayerOnSignature<EventsKey>;
    /***
     * @type {LayerOnSignature<void>}
     */
    un: LayerOnSignature<void>;
    /**
     * @private
     * @type {?import("../events.js").EventsKey}
     */
    private mapPrecomposeKey_;
    /**
     * @private
     * @type {?import("../events.js").EventsKey}
     */
    private mapRenderKey_;
    /**
     * @private
     * @type {?import("../events.js").EventsKey}
     */
    private sourceChangeKey_;
    /**
     * @private
     * @type {RendererType}
     */
    private renderer_;
    /**
     * @private
     * @type {boolean}
     */
    private sourceReady_;
    /**
     * @protected
     * @type {boolean}
     */
    protected rendered: boolean;
    /**
     * In charge to manage the rendering of the layer. One layer type is
     * bounded with one layer renderer.
     * @param {?import("../Map.js").FrameState} frameState Frame state.
     * @param {HTMLElement} target Target which the renderer may (but need not) use
     * for rendering its content.
     * @return {HTMLElement|null} The rendered element.
     */
    render(frameState: FrameState | null, target: HTMLElement): HTMLElement | null;
    /**
     * Get the layer source.
     * @return {SourceType|null} The layer source (or `null` if not yet set).
     * @observable
     * @api
     */
    getSource(): SourceType | null;
    /**
     * @return {SourceType|null} The source being rendered.
     */
    getRenderSource(): SourceType | null;
    /**
     * @private
     */
    private handleSourceChange_;
    /**
     * @private
     */
    private handleSourcePropertyChange_;
    /**
     * @param {import("../pixel").Pixel} pixel Pixel.
     * @return {Promise<Array<import("../Feature").FeatureLike>>} Promise that resolves with
     * an array of features.
     */
    getFeatures(pixel: Pixel): Promise<Array<FeatureLike>>;
    /**
     * @param {import("../pixel").Pixel} pixel Pixel.
     * @return {Uint8ClampedArray|Uint8Array|Float32Array|DataView|null} Pixel data.
     */
    getData(pixel: Pixel): Uint8ClampedArray | Uint8Array | Float32Array | DataView | null;
    /**
     * The layer is visible on the map view, i.e. within its min/max resolution or zoom and
     * extent, not set to `visible: false`, and not inside a layer group that is set
     * to `visible: false`.
     * @param {View|import("../View.js").ViewStateLayerStateExtent} [view] View or {@link import("../Map.js").FrameState}.
     * Only required when the layer is not added to a map.
     * @return {boolean} The layer is visible in the map view.
     * @api
     */
    isVisible(view?: View | ViewStateLayerStateExtent): boolean;
    /**
     * Get the attributions of the source of this layer for the given view.
     * @param {View|import("../View.js").ViewStateLayerStateExtent} [view] View or {@link import("../Map.js").FrameState}.
     * Only required when the layer is not added to a map.
     * @return {Array<string>} Attributions for this layer at the given view.
     * @api
     */
    getAttributions(view?: View | ViewStateLayerStateExtent): Array<string>;
    /**
     * Called when a layer is not visible during a map render.
     */
    unrender(): void;
    /** @return {string} Declutter */
    getDeclutter(): string;
    /**
     * @param {import("../Map.js").FrameState} frameState Frame state.
     * @param {import("../layer/Layer.js").State} layerState Layer state.
     */
    renderDeclutter(frameState: FrameState, layerState: State$2): void;
    /**
     * When the renderer follows a layout -> render approach, do the final rendering here.
     * @param {import('../Map.js').FrameState} frameState Frame state
     */
    renderDeferred(frameState: FrameState): void;
    /**
     * For use inside the library only.
     * @param {import("../Map.js").default|null} map Map.
     */
    setMapInternal(map: Map | null): void;
    /**
     * For use inside the library only.
     * @return {import("../Map.js").default|null} Map.
     */
    getMapInternal(): Map | null;
    /**
     * Sets the layer to be rendered on top of other layers on a map. The map will
     * not manage this layer in its layers collection. This
     * is useful for temporary layers. To remove an unmanaged layer from the map,
     * use `#setMap(null)`.
     *
     * To add the layer to a map and have it managed by the map, use
     * {@link module:ol/Map~Map#addLayer} instead.
     * @param {import("../Map.js").default|null} map Map.
     * @api
     */
    setMap(map: Map | null): void;
    /**
     * @param {import("../events/Event.js").default} renderEvent Render event
     * @private
     */
    private handlePrecompose_;
    /**
     * Set the layer source.
     * @param {SourceType|null} source The layer source.
     * @observable
     * @api
     */
    setSource(source: SourceType | null): void;
    /**
     * Get the renderer for this layer.
     * @return {RendererType|null} The layer renderer.
     */
    getRenderer(): RendererType | null;
    /**
     * @return {boolean} The layer has a renderer.
     */
    hasRenderer(): boolean;
    /**
     * Create a renderer for this layer.
     * @return {RendererType} A layer renderer.
     * @protected
     */
    protected createRenderer(): RendererType;
    /**
     * This will clear the renderer so that a new one can be created next time it is needed
     */
    clearRenderer(): void;
}

type Type$3 = (arg0: (number | undefined), arg1: boolean | undefined) => (number | undefined);

type Type$2 = (arg0: (number | undefined), arg1: number, arg2: Size, arg3: boolean | undefined) => (number | undefined);

type Type$1 = (arg0: (Coordinate | undefined), arg1: number, arg2: Size, arg3: boolean | undefined, arg4: Array<number> | undefined) => (Coordinate | undefined);

type Constraints = {
    /**
     * Center.
     */
    center: Type$1;
    /**
     * Resolution.
     */
    resolution: Type$2;
    /**
     * Rotation.
     */
    rotation: Type$3;
};
type FitOptions = {
    /**
     * The size in pixels of the box to
     * fit the extent into. Defaults to the size of the map the view is associated with.
     * If no map or multiple maps are connected to the view, provide the desired box size
     * (e.g. `map.getSize()`).
     */
    size?: Size | undefined;
    /**
     * Padding (in pixels) to be
     * cleared inside the view. Values in the array are top, right, bottom and left
     * padding.
     */
    padding?: number[] | undefined;
    /**
     * If the view `constrainResolution` option is `true`,
     * get the nearest extent instead of the closest that actually fits the view.
     */
    nearest?: boolean | undefined;
    /**
     * Minimum resolution that we zoom to.
     */
    minResolution?: number | undefined;
    /**
     * Maximum zoom level that we zoom to. If
     * `minResolution` is given, this property is ignored.
     */
    maxZoom?: number | undefined;
    /**
     * The duration of the animation in milliseconds.
     * By default, there is no animation to the target extent.
     */
    duration?: number | undefined;
    /**
     * The easing function used during
     * the animation (defaults to {@link module :ol/easing.inAndOut}).
     * The function will be called for each frame with a number representing a
     * fraction of the animation's duration.  The function should return a number
     * between 0 and 1 representing the progress toward the destination state.
     */
    easing?: ((arg0: number) => number) | undefined;
    /**
     * Function called when the view is in
     * its final position. The callback will be called with `true` if the animation
     * series completed on its own or `false` if it was cancelled.
     */
    callback?: ((arg0: boolean) => void) | undefined;
};
type ViewOptions = {
    /**
     * The initial center for
     * the view. If a user projection is not set, the coordinate system for the center is
     * specified with the `projection` option. Layer sources will not be fetched if this
     * is not set, but the center can be set later with {@link  #setCenter}.
     */
    center?: Coordinate | undefined;
    /**
     * Rotation constraint.
     * `false` means no constraint. `true` means no constraint, but snap to zero
     * near zero. A number constrains the rotation to that number of values. For
     * example, `4` will constrain the rotation to 0, 90, 180, and 270 degrees.
     */
    constrainRotation?: number | boolean | undefined;
    /**
     * Enable rotation.
     * If `false`, a rotation constraint that always sets the rotation to zero is
     * used. The `constrainRotation` option has no effect if `enableRotation` is
     * `false`.
     */
    enableRotation?: boolean | undefined;
    /**
     * The extent that constrains the
     * view, in other words, nothing outside of this extent can be visible on the map.
     */
    extent?: Extent | undefined;
    /**
     * If true, the extent
     * constraint will only apply to the view center and not the whole extent.
     */
    constrainOnlyCenter?: boolean | undefined;
    /**
     * If true, the extent
     * constraint will be applied smoothly, i.e. allow the view to go slightly outside
     * of the given `extent`.
     */
    smoothExtentConstraint?: boolean | undefined;
    /**
     * The maximum resolution used to determine
     * the resolution constraint. It is used together with `minResolution` (or
     * `maxZoom`) and `zoomFactor`. If unspecified it is calculated in such a way
     * that the projection's validity extent fits in a 256x256 px tile. If the
     * projection is Spherical Mercator (the default) then `maxResolution` defaults
     * to `40075016.68557849 / 256 = 156543.03392804097`.
     */
    maxResolution?: number | undefined;
    /**
     * The minimum resolution used to determine
     * the resolution constraint.  It is used together with `maxResolution` (or
     * `minZoom`) and `zoomFactor`.  If unspecified it is calculated assuming 29
     * zoom levels (with a factor of 2). If the projection is Spherical Mercator
     * (the default) then `minResolution` defaults to
     * `40075016.68557849 / 256 / Math.pow(2, 28) = 0.0005831682455839253`.
     */
    minResolution?: number | undefined;
    /**
     * The maximum zoom level used to determine the
     * resolution constraint. It is used together with `minZoom` (or
     * `maxResolution`) and `zoomFactor`.  Note that if `minResolution` is also
     * provided, it is given precedence over `maxZoom`.
     */
    maxZoom?: number | undefined;
    /**
     * The minimum zoom level used to determine the
     * resolution constraint. It is used together with `maxZoom` (or
     * `minResolution`) and `zoomFactor`.  Note that if `maxResolution` is also
     * provided, it is given precedence over `minZoom`.
     */
    minZoom?: number | undefined;
    /**
     * If `false` the view is constrained so
     * only one world is visible, and you cannot pan off the edge.  If `true` the map
     * may show multiple worlds at low zoom levels.  Only used if the `projection` is
     * global.  Note that if `extent` is also provided it is given precedence.
     */
    multiWorld?: boolean | undefined;
    /**
     * If true, the view will always
     * animate to the closest zoom level after an interaction; false means
     * intermediary zoom levels are allowed.
     */
    constrainResolution?: boolean | undefined;
    /**
     * If true, the resolution
     * min/max values will be applied smoothly, i. e. allow the view to exceed slightly
     * the given resolution or zoom bounds.
     */
    smoothResolutionConstraint?: boolean | undefined;
    /**
     * Allow the view to be zoomed out to
     * show the full configured extent. By default, when a view is configured with an
     * extent, users will not be able to zoom out so the viewport exceeds the extent in
     * either dimension. This means the full extent may not be visible if the viewport
     * is taller or wider than the aspect ratio of the configured extent. If
     * showFullExtent is true, the user will be able to zoom out so that the viewport
     * exceeds the height or width of the configured extent, but not both, allowing the
     * full extent to be shown.
     */
    showFullExtent?: boolean | undefined;
    /**
     * The
     * projection. The default is Spherical Mercator.
     */
    projection?: ProjectionLike;
    /**
     * The initial resolution for the view. The
     * units are `projection` units per pixel (e.g. meters per pixel). An
     * alternative to setting this is to set `zoom`. Layer sources will not be
     * fetched if neither this nor `zoom` are defined, but they can be set later
     * with {@link  #setZoom} or {@link  #setResolution}.
     */
    resolution?: number | undefined;
    /**
     * Resolutions that determine the
     * zoom levels if specified. The index in the array corresponds to the zoom level,
     * therefore the resolution values have to be in descending order. It also constrains
     * the resolution by the minimum and maximum value. If set the `maxResolution`,
     * `minResolution`, `minZoom`, `maxZoom`, and `zoomFactor` options are ignored.
     */
    resolutions?: number[] | undefined;
    /**
     * The initial rotation for the view in radians
     * (positive rotation clockwise, 0 means North).
     */
    rotation?: number | undefined;
    /**
     * Only used if `resolution` is not defined. Zoom
     * level used to calculate the initial resolution for the view.
     */
    zoom?: number | undefined;
    /**
     * The zoom factor used to compute the
     * corresponding resolution.
     */
    zoomFactor?: number | undefined;
    /**
     * Padding (in css pixels).
     * If the map viewport is partially covered with other content (overlays) along
     * its edges, this setting allows to shift the center of the viewport away from
     * that content. The order of the values is top, right, bottom, left.
     */
    padding?: number[] | undefined;
};
type AnimationOptions = {
    /**
     * The center of the view at the end of
     * the animation.
     */
    center?: Coordinate | undefined;
    /**
     * The zoom level of the view at the end of the
     * animation. This takes precedence over `resolution`.
     */
    zoom?: number | undefined;
    /**
     * The resolution of the view at the end
     * of the animation.  If `zoom` is also provided, this option will be ignored.
     */
    resolution?: number | undefined;
    /**
     * The rotation of the view at the end of
     * the animation.
     */
    rotation?: number | undefined;
    /**
     * Optional anchor to remain fixed
     * during a rotation or resolution animation.
     */
    anchor?: Coordinate | undefined;
    /**
     * The duration of the animation in milliseconds.
     */
    duration?: number | undefined;
    /**
     * The easing function used
     * during the animation (defaults to {@link module :ol/easing.inAndOut}).
     * The function will be called for each frame with a number representing a
     * fraction of the animation's duration.  The function should return a number
     * between 0 and 1 representing the progress toward the destination state.
     */
    easing?: ((arg0: number) => number) | undefined;
};
type State$1 = {
    /**
     * Center (in view projection coordinates).
     */
    center: Coordinate;
    /**
     * Projection.
     */
    projection: Projection;
    /**
     * Resolution.
     */
    resolution: number;
    /**
     * The next center during an animation series.
     */
    nextCenter?: Coordinate | undefined;
    /**
     * The next resolution during an animation series.
     */
    nextResolution?: number | undefined;
    /**
     * The next rotation during an animation series.
     */
    nextRotation?: number | undefined;
    /**
     * Rotation.
     */
    rotation: number;
    /**
     * Zoom.
     */
    zoom: number;
};
/**
 * Like {@link import ("./Map.js").FrameState}, but just `viewState` and `extent`.
 */
type ViewStateLayerStateExtent = {
    /**
     * View state.
     */
    viewState: State$1;
    /**
     * Extent (in user projection coordinates).
     */
    extent: Extent;
    /**
     * Layer states.
     */
    layerStatesArray?: State$2[] | undefined;
};
type ViewObjectEventTypes = Types$2 | "change:center" | "change:resolution" | "change:rotation";
/**
 * *
 */
type ViewOnSignature<Return> = OnSignature<EventTypes, BaseEvent, Return> & OnSignature<ViewObjectEventTypes, ObjectEvent, Return> & CombinedOnSignature<EventTypes | ViewObjectEventTypes, Return>;
/**
 * @typedef {import("./ObjectEventType").Types|'change:center'|'change:resolution'|'change:rotation'} ViewObjectEventTypes
 */
/***
 * @template Return
 * @typedef {import("./Observable").OnSignature<import("./Observable").EventTypes, import("./events/Event.js").default, Return> &
 *   import("./Observable").OnSignature<ViewObjectEventTypes, import("./Object").ObjectEvent, Return> &
 *   import("./Observable").CombinedOnSignature<import("./Observable").EventTypes|ViewObjectEventTypes, Return>} ViewOnSignature
 */
/**
 * @classdesc
 * A View object represents a simple 2D view of the map.
 *
 * This is the object to act upon to change the center, resolution,
 * and rotation of the map.
 *
 * A View has a `projection`. The projection determines the
 * coordinate system of the center, and its units determine the units of the
 * resolution (projection units per pixel). The default projection is
 * Web Mercator (EPSG:3857).
 *
 * ### The view states
 *
 * A View is determined by three states: `center`, `resolution`,
 * and `rotation`. Each state has a corresponding getter and setter, e.g.
 * `getCenter` and `setCenter` for the `center` state.
 *
 * The `zoom` state is actually not saved on the view: all computations
 * internally use the `resolution` state. Still, the `setZoom` and `getZoom`
 * methods are available, as well as `getResolutionForZoom` and
 * `getZoomForResolution` to switch from one system to the other.
 *
 * ### The constraints
 *
 * `setCenter`, `setResolution` and `setRotation` can be used to change the
 * states of the view, but any constraint defined in the constructor will
 * be applied along the way.
 *
 * A View object can have a *resolution constraint*, a *rotation constraint*
 * and a *center constraint*.
 *
 * The *resolution constraint* typically restricts min/max values and
 * snaps to specific resolutions. It is determined by the following
 * options: `resolutions`, `maxResolution`, `maxZoom` and `zoomFactor`.
 * If `resolutions` is set, the other three options are ignored. See
 * documentation for each option for more information. By default, the view
 * only has a min/max restriction and allow intermediary zoom levels when
 * pinch-zooming for example.
 *
 * The *rotation constraint* snaps to specific angles. It is determined
 * by the following options: `enableRotation` and `constrainRotation`.
 * By default rotation is allowed and its value is snapped to zero when approaching the
 * horizontal.
 *
 * The *center constraint* is determined by the `extent` option. By
 * default the view center is not constrained at all.
 *
 * ### Changing the view state
 *
 * It is important to note that `setZoom`, `setResolution`, `setCenter` and
 * `setRotation` are subject to the above mentioned constraints. As such, it
 * may sometimes not be possible to know in advance the resulting state of the
 * View. For example, calling `setResolution(10)` does not guarantee that
 * `getResolution()` will return `10`.
 *
 * A consequence of this is that, when applying a delta on the view state, one
 * should use `adjustCenter`, `adjustRotation`, `adjustZoom` and `adjustResolution`
 * rather than the corresponding setters. This will let view do its internal
 * computations. Besides, the `adjust*` methods also take an `anchor`
 * argument which allows specifying an origin for the transformation.
 *
 * ### Interacting with the view
 *
 * View constraints are usually only applied when the view is *at rest*, meaning that
 * no interaction or animation is ongoing. As such, if the user puts the view in a
 * state that is not equivalent to a constrained one (e.g. rotating the view when
 * the snap angle is 0), an animation will be triggered at the interaction end to
 * put back the view to a stable state;
 *
 * @api
 */
declare class View extends BaseObject {
    /**
     * @param {ViewOptions} [options] View options.
     */
    constructor(options?: ViewOptions);
    /***
     * @type {ViewOnSignature<import("./events").EventsKey>}
     */
    on: ViewOnSignature<EventsKey>;
    /***
     * @type {ViewOnSignature<import("./events").EventsKey>}
     */
    once: ViewOnSignature<EventsKey>;
    /***
     * @type {ViewOnSignature<void>}
     */
    un: ViewOnSignature<void>;
    /**
     * @private
     * @type {Array<number>}
     */
    private hints_;
    /**
     * @private
     * @type {Array<Array<Animation>>}
     */
    private animations_;
    /**
     * @private
     * @type {number|undefined}
     */
    private updateAnimationKey_;
    /**
     * @private
     * @const
     * @type {import("./proj/Projection.js").default}
     */
    private projection_;
    /**
     * @private
     * @type {import("./size.js").Size}
     */
    private viewportSize_;
    /**
     * @private
     * @type {import("./coordinate.js").Coordinate|undefined}
     */
    private targetCenter_;
    /**
     * @private
     * @type {number|undefined}
     */
    private targetResolution_;
    /**
     * @private
     * @type {number|undefined}
     */
    private targetRotation_;
    /**
     * @private
     * @type {import("./coordinate.js").Coordinate}
     */
    private nextCenter_;
    /**
     * @private
     * @type {number}
     */
    private nextResolution_;
    /**
     * @private
     * @type {number}
     */
    private nextRotation_;
    /**
     * @private
     * @type {import("./coordinate.js").Coordinate|undefined}
     */
    private cancelAnchor_;
    /**
     * Set up the view with the given options.
     * @param {ViewOptions} options View options.
     */
    applyOptions_(options: ViewOptions): void;
    /**
     * @private
     * @type {number}
     */
    private maxResolution_;
    /**
     * @private
     * @type {number}
     */
    private minResolution_;
    /**
     * @private
     * @type {number}
     */
    private zoomFactor_;
    /**
     * @private
     * @type {Array<number>|undefined}
     */
    private resolutions_;
    /**
     * @type {Array<number>|undefined}
     * @private
     */
    private padding_;
    /**
     * @private
     * @type {number}
     */
    private minZoom_;
    /**
     * @private
     * @type {Constraints}
     */
    private constraints_;
    set padding(padding: Array<number> | undefined);
    /**
     * Padding (in css pixels).
     * If the map viewport is partially covered with other content (overlays) along
     * its edges, this setting allows to shift the center of the viewport away from that
     * content. The order of the values in the array is top, right, bottom, left.
     * The default is no padding, which is equivalent to `[0, 0, 0, 0]`.
     * @type {Array<number>|undefined}
     * @api
     */
    get padding(): Array<number> | undefined;
    /**
     * Get an updated version of the view options used to construct the view.  The
     * current resolution (or zoom), center, and rotation are applied to any stored
     * options.  The provided options can be used to apply new min/max zoom or
     * resolution limits.
     * @param {ViewOptions} newOptions New options to be applied.
     * @return {ViewOptions} New options updated with the current view state.
     */
    getUpdatedOptions_(newOptions: ViewOptions): ViewOptions;
    /**
     * Animate the view.  The view's center, zoom (or resolution), and rotation
     * can be animated for smooth transitions between view states.  For example,
     * to animate the view to a new zoom level:
     *
     *     view.animate({zoom: view.getZoom() + 1});
     *
     * By default, the animation lasts one second and uses in-and-out easing.  You
     * can customize this behavior by including `duration` (in milliseconds) and
     * `easing` options (see {@link module:ol/easing}).
     *
     * To chain together multiple animations, call the method with multiple
     * animation objects.  For example, to first zoom and then pan:
     *
     *     view.animate({zoom: 10}, {center: [0, 0]});
     *
     * If you provide a function as the last argument to the animate method, it
     * will get called at the end of an animation series.  The callback will be
     * called with `true` if the animation series completed on its own or `false`
     * if it was cancelled.
     *
     * Animations are cancelled by user interactions (e.g. dragging the map) or by
     * calling `view.setCenter()`, `view.setResolution()`, or `view.setRotation()`
     * (or another method that calls one of these).
     *
     * @param {...(AnimationOptions|function(boolean): void)} var_args Animation
     *     options.  Multiple animations can be run in series by passing multiple
     *     options objects.  To run multiple animations in parallel, call the method
     *     multiple times.  An optional callback can be provided as a final
     *     argument.  The callback will be called with a boolean indicating whether
     *     the animation completed without being cancelled.
     * @api
     */
    animate(...args: (AnimationOptions | ((arg0: boolean) => void))[]): void;
    /**
     * @param {...(AnimationOptions|function(boolean): void)} var_args Animation options.
     */
    animateInternal(...args: (AnimationOptions | ((arg0: boolean) => void))[]): void;
    /**
     * Determine if the view is being animated.
     * @return {boolean} The view is being animated.
     * @api
     */
    getAnimating(): boolean;
    /**
     * Determine if the user is interacting with the view, such as panning or zooming.
     * @return {boolean} The view is being interacted with.
     * @api
     */
    getInteracting(): boolean;
    /**
     * Cancel any ongoing animations.
     * @api
     */
    cancelAnimations(): void;
    /**
     * Update all animations.
     */
    updateAnimations_(): void;
    /**
     * @param {number} rotation Target rotation.
     * @param {import("./coordinate.js").Coordinate} anchor Rotation anchor.
     * @return {import("./coordinate.js").Coordinate|undefined} Center for rotation and anchor.
     */
    calculateCenterRotate(rotation: number, anchor: Coordinate): Coordinate | undefined;
    /**
     * @param {number} resolution Target resolution.
     * @param {import("./coordinate.js").Coordinate} anchor Zoom anchor.
     * @return {import("./coordinate.js").Coordinate|undefined} Center for resolution and anchor.
     */
    calculateCenterZoom(resolution: number, anchor: Coordinate): Coordinate | undefined;
    /**
     * Returns the current viewport size.
     * @private
     * @param {number} [rotation] Take into account the rotation of the viewport when giving the size
     * @return {import("./size.js").Size} Viewport size or `[100, 100]` when no viewport is found.
     */
    private getViewportSize_;
    /**
     * Stores the viewport size on the view. The viewport size is not read every time from the DOM
     * to avoid performance hit and layout reflow.
     * This should be done on map size change.
     * Note: the constraints are not resolved during an animation to avoid stopping it
     * @param {import("./size.js").Size} [size] Viewport size; if undefined, [100, 100] is assumed
     */
    setViewportSize(size?: Size): void;
    /**
     * Get the view center.
     * @return {import("./coordinate.js").Coordinate|undefined} The center of the view.
     * @observable
     * @api
     */
    getCenter(): Coordinate | undefined;
    /**
     * Get the view center without transforming to user projection.
     * @return {import("./coordinate.js").Coordinate|undefined} The center of the view.
     */
    getCenterInternal(): Coordinate | undefined;
    /**
     * @return {Constraints} Constraints.
     */
    getConstraints(): Constraints;
    /**
     * @return {boolean} Resolution constraint is set
     */
    getConstrainResolution(): boolean;
    /**
     * @param {Array<number>} [hints] Destination array.
     * @return {Array<number>} Hint.
     */
    getHints(hints?: Array<number>): Array<number>;
    /**
     * Calculate the extent for the current view state and the passed box size.
     * @param {import("./size.js").Size} [size] The pixel dimensions of the box
     * into which the calculated extent should fit. Defaults to the size of the
     * map the view is associated with.
     * If no map or multiple maps are connected to the view, provide the desired
     * box size (e.g. `map.getSize()`).
     * @return {import("./extent.js").Extent} Extent.
     * @api
     */
    calculateExtent(size?: Size): Extent;
    /**
     * @param {import("./size.js").Size} [size] Box pixel size. If not provided,
     * the map's last known viewport size will be used.
     * @return {import("./extent.js").Extent} Extent.
     */
    calculateExtentInternal(size?: Size): Extent;
    /**
     * Get the maximum resolution of the view.
     * @return {number} The maximum resolution of the view.
     * @api
     */
    getMaxResolution(): number;
    /**
     * Get the minimum resolution of the view.
     * @return {number} The minimum resolution of the view.
     * @api
     */
    getMinResolution(): number;
    /**
     * Get the maximum zoom level for the view.
     * @return {number} The maximum zoom level.
     * @api
     */
    getMaxZoom(): number;
    /**
     * Set a new maximum zoom level for the view.
     * @param {number} zoom The maximum zoom level.
     * @api
     */
    setMaxZoom(zoom: number): void;
    /**
     * Get the minimum zoom level for the view.
     * @return {number} The minimum zoom level.
     * @api
     */
    getMinZoom(): number;
    /**
     * Set a new minimum zoom level for the view.
     * @param {number} zoom The minimum zoom level.
     * @api
     */
    setMinZoom(zoom: number): void;
    /**
     * Set whether the view should allow intermediary zoom levels.
     * @param {boolean} enabled Whether the resolution is constrained.
     * @api
     */
    setConstrainResolution(enabled: boolean): void;
    /**
     * Get the view projection.
     * @return {import("./proj/Projection.js").default} The projection of the view.
     * @api
     */
    getProjection(): Projection;
    /**
     * Get the view resolution.
     * @return {number|undefined} The resolution of the view.
     * @observable
     * @api
     */
    getResolution(): number | undefined;
    /**
     * Get the resolutions for the view. This returns the array of resolutions
     * passed to the constructor of the View, or undefined if none were given.
     * @return {Array<number>|undefined} The resolutions of the view.
     * @api
     */
    getResolutions(): Array<number> | undefined;
    /**
     * Get the resolution for a provided extent (in map units) and size (in pixels).
     * @param {import("./extent.js").Extent} extent Extent.
     * @param {import("./size.js").Size} [size] Box pixel size.
     * @return {number} The resolution at which the provided extent will render at
     *     the given size.
     * @api
     */
    getResolutionForExtent(extent: Extent, size?: Size): number;
    /**
     * Get the resolution for a provided extent (in map units) and size (in pixels).
     * @param {import("./extent.js").Extent} extent Extent.
     * @param {import("./size.js").Size} [size] Box pixel size.
     * @return {number} The resolution at which the provided extent will render at
     *     the given size.
     */
    getResolutionForExtentInternal(extent: Extent, size?: Size): number;
    /**
     * Return a function that returns a value between 0 and 1 for a
     * resolution. Exponential scaling is assumed.
     * @param {number} [power] Power.
     * @return {function(number): number} Resolution for value function.
     */
    getResolutionForValueFunction(power?: number): (arg0: number) => number;
    /**
     * Get the view rotation.
     * @return {number} The rotation of the view in radians.
     * @observable
     * @api
     */
    getRotation(): number;
    /**
     * Return a function that returns a resolution for a value between
     * 0 and 1. Exponential scaling is assumed.
     * @param {number} [power] Power.
     * @return {function(number): number} Value for resolution function.
     */
    getValueForResolutionFunction(power?: number): (arg0: number) => number;
    /**
     * Returns the size of the viewport minus padding.
     * @private
     * @param {number} [rotation] Take into account the rotation of the viewport when giving the size
     * @return {import("./size.js").Size} Viewport size reduced by the padding.
     */
    private getViewportSizeMinusPadding_;
    /**
     * @return {State} View state.
     */
    getState(): State$1;
    /**
     * @return {ViewStateLayerStateExtent} Like `FrameState`, but just `viewState` and `extent`.
     */
    getViewStateAndExtent(): ViewStateLayerStateExtent;
    /**
     * Get the current zoom level. This method may return non-integer zoom levels
     * if the view does not constrain the resolution, or if an interaction or
     * animation is underway.
     * @return {number|undefined} Zoom.
     * @api
     */
    getZoom(): number | undefined;
    /**
     * Get the zoom level for a resolution.
     * @param {number} resolution The resolution.
     * @return {number|undefined} The zoom level for the provided resolution.
     * @api
     */
    getZoomForResolution(resolution: number): number | undefined;
    /**
     * Get the resolution for a zoom level.
     * @param {number} zoom Zoom level.
     * @return {number} The view resolution for the provided zoom level.
     * @api
     */
    getResolutionForZoom(zoom: number): number;
    /**
     * Fit the given geometry or extent based on the given map size and border.
     * The size is pixel dimensions of the box to fit the extent into.
     * In most cases you will want to use the map size, that is `map.getSize()`.
     * Takes care of the map angle.
     * @param {import("./geom/SimpleGeometry.js").default|import("./extent.js").Extent} geometryOrExtent The geometry or
     *     extent to fit the view to.
     * @param {FitOptions} [options] Options.
     * @api
     */
    fit(geometryOrExtent: SimpleGeometry | Extent, options?: FitOptions): void;
    /**
     * Calculate rotated extent
     * @param {import("./geom/SimpleGeometry.js").default} geometry The geometry.
     * @return {import("./extent").Extent} The rotated extent for the geometry.
     */
    rotatedExtentForGeometry(geometry: SimpleGeometry): Extent;
    /**
     * @param {import("./geom/SimpleGeometry.js").default} geometry The geometry.
     * @param {FitOptions} [options] Options.
     */
    fitInternal(geometry: SimpleGeometry, options?: FitOptions): void;
    /**
     * Center on coordinate and view position.
     * @param {import("./coordinate.js").Coordinate} coordinate Coordinate.
     * @param {import("./size.js").Size} size Box pixel size.
     * @param {import("./pixel.js").Pixel} position Position on the view to center on.
     * @api
     */
    centerOn(coordinate: Coordinate, size: Size, position: Pixel): void;
    /**
     * @param {import("./coordinate.js").Coordinate} coordinate Coordinate.
     * @param {import("./size.js").Size} size Box pixel size.
     * @param {import("./pixel.js").Pixel} position Position on the view to center on.
     */
    centerOnInternal(coordinate: Coordinate, size: Size, position: Pixel): void;
    /**
     * Calculates the shift between map and viewport center.
     * @param {import("./coordinate.js").Coordinate} center Center.
     * @param {number} resolution Resolution.
     * @param {number} rotation Rotation.
     * @param {import("./size.js").Size} size Size.
     * @return {Array<number>|undefined} Center shift.
     */
    calculateCenterShift(center: Coordinate, resolution: number, rotation: number, size: Size): Array<number> | undefined;
    /**
     * @return {boolean} Is defined.
     */
    isDef(): boolean;
    /**
     * Adds relative coordinates to the center of the view. Any extent constraint will apply.
     * @param {import("./coordinate.js").Coordinate} deltaCoordinates Relative value to add.
     * @api
     */
    adjustCenter(deltaCoordinates: Coordinate): void;
    /**
     * Adds relative coordinates to the center of the view. Any extent constraint will apply.
     * @param {import("./coordinate.js").Coordinate} deltaCoordinates Relative value to add.
     */
    adjustCenterInternal(deltaCoordinates: Coordinate): void;
    /**
     * Multiply the view resolution by a ratio, optionally using an anchor. Any resolution
     * constraint will apply.
     * @param {number} ratio The ratio to apply on the view resolution.
     * @param {import("./coordinate.js").Coordinate} [anchor] The origin of the transformation.
     * @api
     */
    adjustResolution(ratio: number, anchor?: Coordinate): void;
    /**
     * Multiply the view resolution by a ratio, optionally using an anchor. Any resolution
     * constraint will apply.
     * @param {number} ratio The ratio to apply on the view resolution.
     * @param {import("./coordinate.js").Coordinate} [anchor] The origin of the transformation.
     */
    adjustResolutionInternal(ratio: number, anchor?: Coordinate): void;
    /**
     * Adds a value to the view zoom level, optionally using an anchor. Any resolution
     * constraint will apply.
     * @param {number} delta Relative value to add to the zoom level.
     * @param {import("./coordinate.js").Coordinate} [anchor] The origin of the transformation.
     * @api
     */
    adjustZoom(delta: number, anchor?: Coordinate): void;
    /**
     * Adds a value to the view rotation, optionally using an anchor. Any rotation
     * constraint will apply.
     * @param {number} delta Relative value to add to the zoom rotation, in radians.
     * @param {import("./coordinate.js").Coordinate} [anchor] The rotation center.
     * @api
     */
    adjustRotation(delta: number, anchor?: Coordinate): void;
    /**
     * @param {number} delta Relative value to add to the zoom rotation, in radians.
     * @param {import("./coordinate.js").Coordinate} [anchor] The rotation center.
     */
    adjustRotationInternal(delta: number, anchor?: Coordinate): void;
    /**
     * Set the center of the current view. Any extent constraint will apply.
     * @param {import("./coordinate.js").Coordinate|undefined} center The center of the view.
     * @observable
     * @api
     */
    setCenter(center: Coordinate | undefined): void;
    /**
     * Set the center using the view projection (not the user projection).
     * @param {import("./coordinate.js").Coordinate|undefined} center The center of the view.
     */
    setCenterInternal(center: Coordinate | undefined): void;
    /**
     * @param {import("./ViewHint.js").default} hint Hint.
     * @param {number} delta Delta.
     * @return {number} New value.
     */
    setHint(hint: any, delta: number): number;
    /**
     * Set the resolution for this view. Any resolution constraint will apply.
     * @param {number|undefined} resolution The resolution of the view.
     * @observable
     * @api
     */
    setResolution(resolution: number | undefined): void;
    /**
     * Set the rotation for this view. Any rotation constraint will apply.
     * @param {number} rotation The rotation of the view in radians.
     * @observable
     * @api
     */
    setRotation(rotation: number): void;
    /**
     * Zoom to a specific zoom level. Any resolution constrain will apply.
     * @param {number} zoom Zoom level.
     * @api
     */
    setZoom(zoom: number): void;
    /**
     * Recompute rotation/resolution/center based on target values.
     * Note: we have to compute rotation first, then resolution and center considering that
     * parameters can influence one another in case a view extent constraint is present.
     * @param {boolean} [doNotCancelAnims] Do not cancel animations.
     * @param {boolean} [forceMoving] Apply constraints as if the view is moving.
     * @private
     */
    private applyTargetState_;
    /**
     * If any constraints need to be applied, an animation will be triggered.
     * This is typically done on interaction end.
     * Note: calling this with a duration of 0 will apply the constrained values straight away,
     * without animation.
     * @param {number} [duration] The animation duration in ms.
     * @param {number} [resolutionDirection] Which direction to zoom.
     * @param {import("./coordinate.js").Coordinate} [anchor] The origin of the transformation.
     */
    resolveConstraints(duration?: number, resolutionDirection?: number, anchor?: Coordinate): void;
    /**
     * Notify the View that an interaction has started.
     * The view state will be resolved to a stable one if needed
     * (depending on its constraints).
     * @api
     */
    beginInteraction(): void;
    /**
     * Notify the View that an interaction has ended. The view state will be resolved
     * to a stable one if needed (depending on its constraints).
     * @param {number} [duration] Animation duration in ms.
     * @param {number} [resolutionDirection] Which direction to zoom.
     * @param {import("./coordinate.js").Coordinate} [anchor] The origin of the transformation.
     * @api
     */
    endInteraction(duration?: number, resolutionDirection?: number, anchor?: Coordinate): void;
    /**
     * Notify the View that an interaction has ended. The view state will be resolved
     * to a stable one if needed (depending on its constraints).
     * @param {number} [duration] Animation duration in ms.
     * @param {number} [resolutionDirection] Which direction to zoom.
     * @param {import("./coordinate.js").Coordinate} [anchor] The origin of the transformation.
     */
    endInteractionInternal(duration?: number, resolutionDirection?: number, anchor?: Coordinate): void;
    /**
     * Get a valid position for the view center according to the current constraints.
     * @param {import("./coordinate.js").Coordinate|undefined} targetCenter Target center position.
     * @param {number} [targetResolution] Target resolution. If not supplied, the current one will be used.
     * This is useful to guess a valid center position at a different zoom level.
     * @return {import("./coordinate.js").Coordinate|undefined} Valid center position.
     */
    getConstrainedCenter(targetCenter: Coordinate | undefined, targetResolution?: number): Coordinate | undefined;
    /**
     * Get a valid zoom level according to the current view constraints.
     * @param {number|undefined} targetZoom Target zoom.
     * @param {number} [direction] Indicate which resolution should be used
     * by a renderer if the view resolution does not match any resolution of the tile source.
     * If 0, the nearest resolution will be used. If 1, the nearest lower resolution
     * will be used. If -1, the nearest higher resolution will be used.
     * @return {number|undefined} Valid zoom level.
     */
    getConstrainedZoom(targetZoom: number | undefined, direction?: number): number | undefined;
    /**
     * Get a valid resolution according to the current view constraints.
     * @param {number|undefined} targetResolution Target resolution.
     * @param {number} [direction] Indicate which resolution should be used
     * by a renderer if the view resolution does not match any resolution of the tile source.
     * If 0, the nearest resolution will be used. If 1, the nearest lower resolution
     * will be used. If -1, the nearest higher resolution will be used.
     * @return {number|undefined} Valid resolution.
     */
    getConstrainedResolution(targetResolution: number | undefined, direction?: number): number | undefined;
}

/**
 * State of the source, one of 'undefined', 'loading', 'ready' or 'error'.
 */
type State = "undefined" | "loading" | "ready" | "error";
/**
 * A function that takes a {@link import ("../View.js").ViewStateLayerStateExtent} and returns a string or
 * an array of strings representing source attributions.
 */
type Attribution = (arg0: ViewStateLayerStateExtent) => (string | Array<string>);
/**
 * A type that can be used to provide attribution information for data sources.
 *
 * It represents either
 * a simple string (e.g. `'© Acme Inc.'`)
 * an array of simple strings (e.g. `['© Acme Inc.', '© Bacme Inc.']`)
 * a function that returns a string or array of strings ({@link module :ol/source/Source~Attribution})
 */
type AttributionLike = string | Array<string> | Attribution;
type Options$t = {
    /**
     * Attributions.
     */
    attributions?: AttributionLike | undefined;
    /**
     * Attributions are collapsible.
     */
    attributionsCollapsible?: boolean | undefined;
    /**
     * Projection. Default is the view projection.
     */
    projection?: ProjectionLike;
    /**
     * State.
     */
    state?: State | undefined;
    /**
     * WrapX.
     */
    wrapX?: boolean | undefined;
    /**
     * Use interpolated values when resampling.  By default,
     * the nearest neighbor is used when resampling.
     */
    interpolate?: boolean | undefined;
};
/**
 * @typedef {'undefined' | 'loading' | 'ready' | 'error'} State
 * State of the source, one of 'undefined', 'loading', 'ready' or 'error'.
 */
/**
 * A function that takes a {@link import("../View.js").ViewStateLayerStateExtent} and returns a string or
 * an array of strings representing source attributions.
 *
 * @typedef {function(import("../View.js").ViewStateLayerStateExtent): (string|Array<string>)} Attribution
 */
/**
 * A type that can be used to provide attribution information for data sources.
 *
 * It represents either
 * a simple string (e.g. `'© Acme Inc.'`)
 * an array of simple strings (e.g. `['© Acme Inc.', '© Bacme Inc.']`)
 * a function that returns a string or array of strings ({@link module:ol/source/Source~Attribution})
 *
 * @typedef {string|Array<string>|Attribution} AttributionLike
 */
/**
 * @typedef {Object} Options
 * @property {AttributionLike} [attributions] Attributions.
 * @property {boolean} [attributionsCollapsible=true] Attributions are collapsible.
 * @property {import("../proj.js").ProjectionLike} [projection] Projection. Default is the view projection.
 * @property {import("./Source.js").State} [state='ready'] State.
 * @property {boolean} [wrapX=false] WrapX.
 * @property {boolean} [interpolate=false] Use interpolated values when resampling.  By default,
 * the nearest neighbor is used when resampling.
 */
/**
 * @classdesc
 * Abstract base class; normally only used for creating subclasses and not
 * instantiated in apps.
 * Base class for {@link module:ol/layer/Layer~Layer} sources.
 *
 * A generic `change` event is triggered when the state of the source changes.
 * @abstract
 * @api
 */
declare class Source extends BaseObject {
    /**
     * @param {Options} options Source options.
     */
    constructor(options: Options$t);
    /**
     * @protected
     * @type {import("../proj/Projection.js").default|null}
     */
    protected projection: Projection | null;
    /**
     * @private
     * @type {?Attribution}
     */
    private attributions_;
    /**
     * @private
     * @type {boolean}
     */
    private attributionsCollapsible_;
    /**
     * This source is currently loading data. Sources that defer loading to the
     * map's tile queue never set this to `true`.
     * @type {boolean}
     */
    loading: boolean;
    /**
     * @private
     * @type {import("./Source.js").State}
     */
    private state_;
    /**
     * @private
     * @type {boolean}
     */
    private wrapX_;
    /**
     * @private
     * @type {boolean}
     */
    private interpolate_;
    /**
     * @protected
     * @type {function(import("../View.js").ViewOptions):void}
     */
    protected viewResolver: (arg0: ViewOptions) => void;
    /**
     * @protected
     * @type {function(Error):void}
     */
    protected viewRejector: (arg0: Error) => void;
    /**
     * @private
     * @type {Promise<import("../View.js").ViewOptions>}
     */
    private viewPromise_;
    /**
     * Get the attribution function for the source.
     * @return {?Attribution} Attribution function.
     * @api
     */
    getAttributions(): Attribution | null;
    /**
     * @return {boolean} Attributions are collapsible.
     * @api
     */
    getAttributionsCollapsible(): boolean;
    /**
     * Get the projection of the source.
     * @return {import("../proj/Projection.js").default|null} Projection.
     * @api
     */
    getProjection(): Projection | null;
    /**
     * @param {import("../proj/Projection").default} [projection] Projection.
     * @return {Array<number>|null} Resolutions.
     */
    getResolutions(projection?: Projection): Array<number> | null;
    /**
     * @return {Promise<import("../View.js").ViewOptions>} A promise for view-related properties.
     */
    getView(): Promise<ViewOptions>;
    /**
     * Get the state of the source, see {@link import("./Source.js").State} for possible states.
     * @return {import("./Source.js").State} State.
     * @api
     */
    getState(): State;
    /**
     * @return {boolean|undefined} Wrap X.
     */
    getWrapX(): boolean | undefined;
    /**
     * @return {boolean} Use linear interpolation when resampling.
     */
    getInterpolate(): boolean;
    /**
     * Refreshes the source. The source will be cleared, and data from the server will be reloaded.
     * @api
     */
    refresh(): void;
    /**
     * Set the attributions of the source.
     * @param {AttributionLike|undefined} attributions Attributions.
     *     Can be passed as `string`, `Array<string>`, {@link module:ol/source/Source~Attribution},
     *     or `undefined`.
     * @api
     */
    setAttributions(attributions: AttributionLike | undefined): void;
    /**
     * Set the state of the source.
     * @param {import("./Source.js").State} state State.
     */
    setState(state: State): void;
}

type TileSourceEventTypes = "tileloadstart" | "tileloadend" | "tileloaderror";

/**
 * @classdesc
 * Events emitted by {@link module:ol/source/Tile~TileSource} instances are instances of this
 * type.
 */
declare class TileSourceEvent extends BaseEvent {
    /**
     * @param {string} type Type.
     * @param {import("../Tile.js").default} tile The tile.
     */
    constructor(type: string, tile: Tile);
    /**
     * The tile related to the event.
     * @type {import("../Tile.js").default}
     * @api
     */
    tile: Tile;
}

/**
 * *
 */
type TileSourceOnSignature<Return> = OnSignature<EventTypes, BaseEvent, Return> & OnSignature<Types$2, ObjectEvent, Return> & OnSignature<TileSourceEventTypes, TileSourceEvent, Return> & CombinedOnSignature<EventTypes | Types$2 | TileSourceEventTypes, Return>;
type Options$s = {
    /**
     * Attributions.
     */
    attributions?: AttributionLike | undefined;
    /**
     * Attributions are collapsible.
     */
    attributionsCollapsible?: boolean | undefined;
    /**
     * Deprecated.  Use the cacheSize option on the layer instead.
     */
    cacheSize?: number | undefined;
    /**
     * TilePixelRatio.
     */
    tilePixelRatio?: number | undefined;
    /**
     * Projection.
     */
    projection?: ProjectionLike;
    /**
     * State.
     */
    state?: State | undefined;
    /**
     * TileGrid.
     */
    tileGrid?: TileGrid | undefined;
    /**
     * WrapX.
     */
    wrapX?: boolean | undefined;
    /**
     * Transition.
     */
    transition?: number | undefined;
    /**
     * Key.
     */
    key?: string | undefined;
    /**
     * ZDirection.
     */
    zDirection?: number | NearestDirectionFunction | undefined;
    /**
     * Use interpolated values when resampling.  By default,
     * the nearest neighbor is used when resampling.
     */
    interpolate?: boolean | undefined;
};

/***
 * @template Return
 * @typedef {import("../Observable").OnSignature<import("../Observable").EventTypes, import("../events/Event.js").default, Return> &
 *   import("../Observable").OnSignature<import("../ObjectEventType").Types, import("../Object").ObjectEvent, Return> &
 *   import("../Observable").OnSignature<import("./TileEventType").TileSourceEventTypes, TileSourceEvent, Return> &
 *   import("../Observable").CombinedOnSignature<import("../Observable").EventTypes|import("../ObjectEventType").Types|
 *     import("./TileEventType").TileSourceEventTypes, Return>} TileSourceOnSignature
 */
/**
 * @typedef {Object} Options
 * @property {import("./Source.js").AttributionLike} [attributions] Attributions.
 * @property {boolean} [attributionsCollapsible=true] Attributions are collapsible.
 * @property {number} [cacheSize] Deprecated.  Use the cacheSize option on the layer instead.
 * @property {number} [tilePixelRatio] TilePixelRatio.
 * @property {import("../proj.js").ProjectionLike} [projection] Projection.
 * @property {import("./Source.js").State} [state] State.
 * @property {import("../tilegrid/TileGrid.js").default} [tileGrid] TileGrid.
 * @property {boolean} [wrapX=false] WrapX.
 * @property {number} [transition] Transition.
 * @property {string} [key] Key.
 * @property {number|import("../array.js").NearestDirectionFunction} [zDirection=0] ZDirection.
 * @property {boolean} [interpolate=false] Use interpolated values when resampling.  By default,
 * the nearest neighbor is used when resampling.
 */
/**
 * @classdesc
 * Abstract base class; normally only used for creating subclasses and not
 * instantiated in apps.
 * Base class for sources providing images divided into a tile grid.
 *
 * @template {import("../Tile.js").default} [TileType=import("../Tile.js").default]
 * @abstract
 * @api
 */
declare class TileSource<TileType extends Tile = Tile> extends Source {
    /**
     * @param {Options} options SourceTile source options.
     */
    constructor(options: Options$s);
    /***
     * @type {TileSourceOnSignature<import("../events").EventsKey>}
     */
    on: TileSourceOnSignature<EventsKey>;
    /***
     * @type {TileSourceOnSignature<import("../events").EventsKey>}
     */
    once: TileSourceOnSignature<EventsKey>;
    /***
     * @type {TileSourceOnSignature<void>}
     */
    un: TileSourceOnSignature<void>;
    /**
     * @private
     * @type {number}
     */
    private tilePixelRatio_;
    /**
     * @type {import("../tilegrid/TileGrid.js").default|null}
     * @protected
     */
    protected tileGrid: TileGrid | null;
    /**
     * @protected
     * @type {import("../size.js").Size}
     */
    protected tmpSize: Size;
    /**
     * @private
     * @type {string}
     */
    private key_;
    /**
     * @protected
     * @type {import("../Tile.js").Options}
     */
    protected tileOptions: Options$D;
    /**
     * zDirection hint, read by the renderer. Indicates which resolution should be used
     * by a renderer if the views resolution does not match any resolution of the tile source.
     * If 0, the nearest resolution will be used. If 1, the nearest lower resolution
     * will be used. If -1, the nearest higher resolution will be used.
     * @type {number|import("../array.js").NearestDirectionFunction}
     */
    zDirection: number | NearestDirectionFunction;
    /**
     * @param {import("../proj/Projection.js").default} projection Projection.
     * @return {number} Gutter.
     */
    getGutterForProjection(projection: Projection): number;
    /**
     * Return the key to be used for all tiles in the source.
     * @return {string} The key for all tiles.
     */
    getKey(): string;
    /**
     * Set the value to be used as the key for all tiles in the source.
     * @param {string} key The key for tiles.
     * @protected
     */
    protected setKey(key: string): void;
    /**
     * @abstract
     * @param {number} z Tile coordinate z.
     * @param {number} x Tile coordinate x.
     * @param {number} y Tile coordinate y.
     * @param {number} pixelRatio Pixel ratio.
     * @param {import("../proj/Projection.js").default} projection Projection.
     * @param {import("../structs/LRUCache.js").default<import("../Tile.js").default>} [tileCache] Tile cache.
     * @return {TileType|null} Tile.
     */
    getTile(z: number, x: number, y: number, pixelRatio: number, projection: Projection, tileCache?: LRUCache<Tile>): TileType | null;
    /**
     * Return the tile grid of the tile source.
     * @return {import("../tilegrid/TileGrid.js").default|null} Tile grid.
     * @api
     */
    getTileGrid(): TileGrid | null;
    /**
     * @param {import("../proj/Projection.js").default} projection Projection.
     * @return {!import("../tilegrid/TileGrid.js").default} Tile grid.
     */
    getTileGridForProjection(projection: Projection): TileGrid;
    /**
     * Get the tile pixel ratio for this source. Subclasses may override this
     * method, which is meant to return a supported pixel ratio that matches the
     * provided `pixelRatio` as close as possible.
     * @param {number} pixelRatio Pixel ratio.
     * @return {number} Tile pixel ratio.
     */
    getTilePixelRatio(pixelRatio: number): number;
    /**
     * @param {number} z Z.
     * @param {number} pixelRatio Pixel ratio.
     * @param {import("../proj/Projection.js").default} projection Projection.
     * @return {import("../size.js").Size} Tile size.
     */
    getTilePixelSize(z: number, pixelRatio: number, projection: Projection): Size;
    /**
     * Returns a tile coordinate wrapped around the x-axis. When the tile coordinate
     * is outside the resolution and extent range of the tile grid, `null` will be
     * returned.
     * @param {import("../tilecoord.js").TileCoord} tileCoord Tile coordinate.
     * @param {import("../proj/Projection.js").default} [projection] Projection.
     * @return {import("../tilecoord.js").TileCoord} Tile coordinate to be passed to the tileUrlFunction or
     *     null if no tile URL should be created for the passed `tileCoord`.
     */
    getTileCoordForTileUrlFunction(tileCoord: TileCoord, projection?: Projection): TileCoord;
    /**
     * Remove all cached reprojected tiles from the source. The next render cycle will create new tiles.
     * @api
     */
    clear(): void;
}

/**
 * An array of three numbers representing the location of a tile in a tile
 * grid. The order is `z` (zoom level), `x` (column), and `y` (row).
 */
type TileCoord = Array<number>;

/**
 * @module ol/TileRange
 */
/**
 * A representation of a contiguous block of tiles.  A tile range is specified
 * by its min/max tile coordinates and is inclusive of coordinates.
 */
declare class TileRange {
    /**
     * @param {number} minX Minimum X.
     * @param {number} maxX Maximum X.
     * @param {number} minY Minimum Y.
     * @param {number} maxY Maximum Y.
     */
    constructor(minX: number, maxX: number, minY: number, maxY: number);
    /**
     * @type {number}
     */
    minX: number;
    /**
     * @type {number}
     */
    maxX: number;
    /**
     * @type {number}
     */
    minY: number;
    /**
     * @type {number}
     */
    maxY: number;
    /**
     * @param {import("./tilecoord.js").TileCoord} tileCoord Tile coordinate.
     * @return {boolean} Contains tile coordinate.
     */
    contains(tileCoord: TileCoord): boolean;
    /**
     * @param {TileRange} tileRange Tile range.
     * @return {boolean} Contains.
     */
    containsTileRange(tileRange: TileRange): boolean;
    /**
     * @param {number} x Tile coordinate x.
     * @param {number} y Tile coordinate y.
     * @return {boolean} Contains coordinate.
     */
    containsXY(x: number, y: number): boolean;
    /**
     * @param {TileRange} tileRange Tile range.
     * @return {boolean} Equals.
     */
    equals(tileRange: TileRange): boolean;
    /**
     * @param {TileRange} tileRange Tile range.
     */
    extend(tileRange: TileRange): void;
    /**
     * @return {number} Height.
     */
    getHeight(): number;
    /**
     * @return {import("./size.js").Size} Size.
     */
    getSize(): Size;
    /**
     * @return {number} Width.
     */
    getWidth(): number;
    /**
     * @param {TileRange} tileRange Tile range.
     * @return {boolean} Intersects.
     */
    intersects(tileRange: TileRange): boolean;
}

type Options$r = {
    /**
     * Extent for the tile grid. No tiles outside this
     * extent will be requested by {@link module :ol/source/Tile~TileSource} sources. When no `origin` or
     * `origins` are configured, the `origin` will be set to the top-left corner of the extent.
     */
    extent?: Extent | undefined;
    /**
     * Minimum zoom.
     */
    minZoom?: number | undefined;
    /**
     * The tile grid origin, i.e. where the `x`
     * and `y` axes meet (`[z, 0, 0]`). Tile coordinates increase left to right and downwards. If not
     * specified, `extent` or `origins` must be provided.
     */
    origin?: Coordinate | undefined;
    /**
     * Tile grid origins, i.e. where
     * the `x` and `y` axes meet (`[z, 0, 0]`), for each zoom level. If given, the array length
     * should match the length of the `resolutions` array, i.e. each resolution can have a different
     * origin. Tile coordinates increase left to right and downwards. If not specified, `extent` or
     * `origin` must be provided.
     */
    origins?: Coordinate[] | undefined;
    /**
     * Resolutions. The array index of each resolution needs
     * to match the zoom level. This means that even if a `minZoom` is configured, the resolutions
     * array will have a length of `maxZoom + 1`.
     */
    resolutions: Array<number>;
    /**
     * Number of tile rows and columns
     * of the grid for each zoom level. If specified the values
     * define each zoom level's extent together with the `origin` or `origins`.
     * A grid `extent` can be configured in addition, and will further limit the extent
     * for which tile requests are made by sources. If the bottom-left corner of
     * an extent is used as `origin` or `origins`, then the `y` value must be
     * negative because OpenLayers tile coordinates use the top left as the origin.
     */
    sizes?: Size[] | undefined;
    /**
     * Tile size.
     * Default is `[256, 256]`.
     */
    tileSize?: number | Size | undefined;
    /**
     * Tile sizes. If given, the array length
     * should match the length of the `resolutions` array, i.e. each resolution can have a different
     * tile size.
     */
    tileSizes?: (number | Size)[] | undefined;
};
/**
 * @typedef {Object} Options
 * @property {import("../extent.js").Extent} [extent] Extent for the tile grid. No tiles outside this
 * extent will be requested by {@link module:ol/source/Tile~TileSource} sources. When no `origin` or
 * `origins` are configured, the `origin` will be set to the top-left corner of the extent.
 * @property {number} [minZoom=0] Minimum zoom.
 * @property {import("../coordinate.js").Coordinate} [origin] The tile grid origin, i.e. where the `x`
 * and `y` axes meet (`[z, 0, 0]`). Tile coordinates increase left to right and downwards. If not
 * specified, `extent` or `origins` must be provided.
 * @property {Array<import("../coordinate.js").Coordinate>} [origins] Tile grid origins, i.e. where
 * the `x` and `y` axes meet (`[z, 0, 0]`), for each zoom level. If given, the array length
 * should match the length of the `resolutions` array, i.e. each resolution can have a different
 * origin. Tile coordinates increase left to right and downwards. If not specified, `extent` or
 * `origin` must be provided.
 * @property {!Array<number>} resolutions Resolutions. The array index of each resolution needs
 * to match the zoom level. This means that even if a `minZoom` is configured, the resolutions
 * array will have a length of `maxZoom + 1`.
 * @property {Array<import("../size.js").Size>} [sizes] Number of tile rows and columns
 * of the grid for each zoom level. If specified the values
 * define each zoom level's extent together with the `origin` or `origins`.
 * A grid `extent` can be configured in addition, and will further limit the extent
 * for which tile requests are made by sources. If the bottom-left corner of
 * an extent is used as `origin` or `origins`, then the `y` value must be
 * negative because OpenLayers tile coordinates use the top left as the origin.
 * @property {number|import("../size.js").Size} [tileSize] Tile size.
 * Default is `[256, 256]`.
 * @property {Array<number|import("../size.js").Size>} [tileSizes] Tile sizes. If given, the array length
 * should match the length of the `resolutions` array, i.e. each resolution can have a different
 * tile size.
 */
/**
 * @classdesc
 * Base class for setting the grid pattern for sources accessing tiled-image
 * servers.
 * @api
 */
declare class TileGrid {
    /**
     * @param {Options} options Tile grid options.
     */
    constructor(options: Options$r);
    /**
     * @protected
     * @type {number}
     */
    protected minZoom: number;
    /**
     * @private
     * @type {!Array<number>}
     */
    private resolutions_;
    /**
     * @private
     * @type {number|undefined}
     */
    private zoomFactor_;
    /**
     * @protected
     * @type {number}
     */
    protected maxZoom: number;
    /**
     * @private
     * @type {import("../coordinate.js").Coordinate|null}
     */
    private origin_;
    /**
     * @private
     * @type {Array<import("../coordinate.js").Coordinate>}
     */
    private origins_;
    /**
     * @private
     * @type {Array<number|import("../size.js").Size>}
     */
    private tileSizes_;
    /**
     * @private
     * @type {number|import("../size.js").Size}
     */
    private tileSize_;
    /**
     * @private
     * @type {import("../extent.js").Extent}
     */
    private extent_;
    /**
     * @private
     * @type {Array<import("../TileRange.js").default>}
     */
    private fullTileRanges_;
    /**
     * @private
     * @type {import("../size.js").Size}
     */
    private tmpSize_;
    /**
     * @private
     * @type {import("../extent.js").Extent}
     */
    private tmpExtent_;
    /**
     * Call a function with each tile coordinate for a given extent and zoom level.
     *
     * @param {import("../extent.js").Extent} extent Extent.
     * @param {number} zoom Integer zoom level.
     * @param {function(import("../tilecoord.js").TileCoord): void} callback Function called with each tile coordinate.
     * @api
     */
    forEachTileCoord(extent: Extent, zoom: number, callback: (arg0: TileCoord) => void): void;
    /**
     * @param {import("../tilecoord.js").TileCoord} tileCoord Tile coordinate.
     * @param {function(number, import("../TileRange.js").default): boolean} callback Callback.
     * @param {import("../TileRange.js").default} [tempTileRange] Temporary import("../TileRange.js").default object.
     * @param {import("../extent.js").Extent} [tempExtent] Temporary import("../extent.js").Extent object.
     * @return {boolean} Callback succeeded.
     */
    forEachTileCoordParentTileRange(tileCoord: TileCoord, callback: (arg0: number, arg1: TileRange) => boolean, tempTileRange?: TileRange, tempExtent?: Extent): boolean;
    /**
     * Get the extent for this tile grid, if it was configured.
     * @return {import("../extent.js").Extent} Extent.
     * @api
     */
    getExtent(): Extent;
    /**
     * Get the maximum zoom level for the grid.
     * @return {number} Max zoom.
     * @api
     */
    getMaxZoom(): number;
    /**
     * Get the minimum zoom level for the grid.
     * @return {number} Min zoom.
     * @api
     */
    getMinZoom(): number;
    /**
     * Get the origin for the grid at the given zoom level.
     * @param {number} z Integer zoom level.
     * @return {import("../coordinate.js").Coordinate} Origin.
     * @api
     */
    getOrigin(z: number): Coordinate;
    /**
     * Get the resolution for the given zoom level.
     * @param {number} z Integer zoom level.
     * @return {number} Resolution.
     * @api
     */
    getResolution(z: number): number;
    /**
     * Get the list of resolutions for the tile grid.
     * @return {Array<number>} Resolutions.
     * @api
     */
    getResolutions(): Array<number>;
    /**
     * @param {import("../tilecoord.js").TileCoord} tileCoord Tile coordinate.
     * @param {import("../TileRange.js").default} [tempTileRange] Temporary import("../TileRange.js").default object.
     * @param {import("../extent.js").Extent} [tempExtent] Temporary import("../extent.js").Extent object.
     * @return {import("../TileRange.js").default|null} Tile range.
     */
    getTileCoordChildTileRange(tileCoord: TileCoord, tempTileRange?: TileRange, tempExtent?: Extent): TileRange | null;
    /**
     * @param {import("../tilecoord.js").TileCoord} tileCoord Tile coordinate.
     * @param {number} z Integer zoom level.
     * @param {import("../TileRange.js").default} [tempTileRange] Temporary import("../TileRange.js").default object.
     * @return {import("../TileRange.js").default|null} Tile range.
     */
    getTileRangeForTileCoordAndZ(tileCoord: TileCoord, z: number, tempTileRange?: TileRange): TileRange | null;
    /**
     * Get a tile range for the given extent and integer zoom level.
     * @param {import("../extent.js").Extent} extent Extent.
     * @param {number} z Integer zoom level.
     * @param {import("../TileRange.js").default} [tempTileRange] Temporary tile range object.
     * @return {import("../TileRange.js").default} Tile range.
     */
    getTileRangeForExtentAndZ(extent: Extent, z: number, tempTileRange?: TileRange): TileRange;
    /**
     * @param {import("../tilecoord.js").TileCoord} tileCoord Tile coordinate.
     * @return {import("../coordinate.js").Coordinate} Tile center.
     */
    getTileCoordCenter(tileCoord: TileCoord): Coordinate;
    /**
     * Get the extent of a tile coordinate.
     *
     * @param {import("../tilecoord.js").TileCoord} tileCoord Tile coordinate.
     * @param {import("../extent.js").Extent} [tempExtent] Temporary extent object.
     * @return {import("../extent.js").Extent} Extent.
     * @api
     */
    getTileCoordExtent(tileCoord: TileCoord, tempExtent?: Extent): Extent;
    /**
     * Get the tile coordinate for the given map coordinate and resolution.  This
     * method considers that coordinates that intersect tile boundaries should be
     * assigned the higher tile coordinate.
     *
     * @param {import("../coordinate.js").Coordinate} coordinate Coordinate.
     * @param {number} resolution Resolution.
     * @param {import("../tilecoord.js").TileCoord} [opt_tileCoord] Destination import("../tilecoord.js").TileCoord object.
     * @return {import("../tilecoord.js").TileCoord} Tile coordinate.
     * @api
     */
    getTileCoordForCoordAndResolution(coordinate: Coordinate, resolution: number, opt_tileCoord?: TileCoord): TileCoord;
    /**
     * Note that this method should not be called for resolutions that correspond
     * to an integer zoom level.  Instead call the `getTileCoordForXYAndZ_` method.
     * @param {number} x X.
     * @param {number} y Y.
     * @param {number} resolution Resolution (for a non-integer zoom level).
     * @param {boolean} reverseIntersectionPolicy Instead of letting edge
     *     intersections go to the higher tile coordinate, let edge intersections
     *     go to the lower tile coordinate.
     * @param {import("../tilecoord.js").TileCoord} [opt_tileCoord] Temporary import("../tilecoord.js").TileCoord object.
     * @return {import("../tilecoord.js").TileCoord} Tile coordinate.
     * @private
     */
    private getTileCoordForXYAndResolution_;
    /**
     * Although there is repetition between this method and `getTileCoordForXYAndResolution_`,
     * they should have separate implementations.  This method is for integer zoom
     * levels.  The other method should only be called for resolutions corresponding
     * to non-integer zoom levels.
     * @param {number} x Map x coordinate.
     * @param {number} y Map y coordinate.
     * @param {number} z Integer zoom level.
     * @param {boolean} reverseIntersectionPolicy Instead of letting edge
     *     intersections go to the higher tile coordinate, let edge intersections
     *     go to the lower tile coordinate.
     * @param {import("../tilecoord.js").TileCoord} [opt_tileCoord] Temporary import("../tilecoord.js").TileCoord object.
     * @return {import("../tilecoord.js").TileCoord} Tile coordinate.
     * @private
     */
    private getTileCoordForXYAndZ_;
    /**
     * Get a tile coordinate given a map coordinate and zoom level.
     * @param {import("../coordinate.js").Coordinate} coordinate Coordinate.
     * @param {number} z Integer zoom level, e.g. the result of a `getZForResolution()` method call
     * @param {import("../tilecoord.js").TileCoord} [opt_tileCoord] Destination import("../tilecoord.js").TileCoord object.
     * @return {import("../tilecoord.js").TileCoord} Tile coordinate.
     * @api
     */
    getTileCoordForCoordAndZ(coordinate: Coordinate, z: number, opt_tileCoord?: TileCoord): TileCoord;
    /**
     * @param {import("../tilecoord.js").TileCoord} tileCoord Tile coordinate.
     * @return {number} Tile resolution.
     */
    getTileCoordResolution(tileCoord: TileCoord): number;
    /**
     * Get the tile size for a zoom level. The type of the return value matches the
     * `tileSize` or `tileSizes` that the tile grid was configured with. To always
     * get an {@link import("../size.js").Size}, run the result through {@link module:ol/size.toSize}.
     * @param {number} z Z.
     * @return {number|import("../size.js").Size} Tile size.
     * @api
     */
    getTileSize(z: number): number | Size;
    /**
     * @param {number} z Zoom level.
     * @return {import("../TileRange.js").default|null} Extent tile range for the specified zoom level.
     */
    getFullTileRange(z: number): TileRange | null;
    /**
     * @param {number} resolution Resolution.
     * @param {number|import("../array.js").NearestDirectionFunction} [opt_direction]
     *     If 0, the nearest resolution will be used.
     *     If 1, the nearest higher resolution (lower Z) will be used. If -1, the
     *     nearest lower resolution (higher Z) will be used. Default is 0.
     *     Use a {@link module:ol/array~NearestDirectionFunction} for more precise control.
     *
     * For example to change tile Z at the midpoint of zoom levels
     * ```js
     * function(value, high, low) {
     *   return value - low * Math.sqrt(high / low);
     * }
     * ```
     * @return {number} Z.
     * @api
     */
    getZForResolution(resolution: number, opt_direction?: number | NearestDirectionFunction): number;
    /**
     * The tile with the provided tile coordinate intersects the given viewport.
     * @param {import('../tilecoord.js').TileCoord} tileCoord Tile coordinate.
     * @param {Array<number>} viewport Viewport as returned from {@link module:ol/extent.getRotatedViewport}.
     * @return {boolean} The tile with the provided tile coordinate intersects the given viewport.
     */
    tileCoordIntersectsViewport(tileCoord: TileCoord, viewport: Array<number>): boolean;
    /**
     * @param {!import("../extent.js").Extent} extent Extent for this tile grid.
     * @private
     */
    private calculateTileRanges_;
}

/**
 * The function is called with a `number` view resolution and a
 * {@link module :ol/coordinate~Coordinate} as arguments, and returns the `number` resolution
 * in projection units at the passed coordinate.
 */
type GetPointResolution = (arg0: number, arg1: Coordinate) => number;
type Options$q = {
    /**
     * The SRS identifier code, e.g. `EPSG:4326`.
     */
    code: string;
    /**
     * Units. Required unless a
     * proj4 projection is defined for `code`.
     */
    units?: Units | undefined;
    /**
     * The validity extent for the SRS.
     */
    extent?: Extent | undefined;
    /**
     * The axis orientation as specified in Proj4.
     */
    axisOrientation?: string | undefined;
    /**
     * Whether the projection is valid for the whole globe.
     */
    global?: boolean | undefined;
    /**
     * The meters per unit for the SRS.
     * If not provided, the `units` are used to get the meters per unit from the {@link METERS_PER_UNIT}lookup table.
     */
    metersPerUnit?: number | undefined;
    /**
     * The world extent for the SRS.
     */
    worldExtent?: Extent | undefined;
    /**
     * Function to determine resolution at a point. The function is called with a
     * `number` view resolution and a {@link module :ol/coordinate~Coordinate} as arguments, and returns
     * the `number` resolution in projection units at the passed coordinate. If this is `undefined`,
     * the default {@link module :ol/proj.getPointResolution} function will be used.
     */
    getPointResolution?: GetPointResolution | undefined;
};
/**
 * The function is called with a `number` view resolution and a
 * {@link module:ol/coordinate~Coordinate} as arguments, and returns the `number` resolution
 * in projection units at the passed coordinate.
 * @typedef {function(number, import("../coordinate.js").Coordinate):number} GetPointResolution
 * @api
 */
/**
 * @typedef {Object} Options
 * @property {string} code The SRS identifier code, e.g. `EPSG:4326`.
 * @property {import("./Units.js").Units} [units] Units. Required unless a
 * proj4 projection is defined for `code`.
 * @property {import("../extent.js").Extent} [extent] The validity extent for the SRS.
 * @property {string} [axisOrientation='enu'] The axis orientation as specified in Proj4.
 * @property {boolean} [global=false] Whether the projection is valid for the whole globe.
 * @property {number} [metersPerUnit] The meters per unit for the SRS.
 * If not provided, the `units` are used to get the meters per unit from the {@link METERS_PER_UNIT}
 * lookup table.
 * @property {import("../extent.js").Extent} [worldExtent] The world extent for the SRS.
 * @property {GetPointResolution} [getPointResolution]
 * Function to determine resolution at a point. The function is called with a
 * `number` view resolution and a {@link module:ol/coordinate~Coordinate} as arguments, and returns
 * the `number` resolution in projection units at the passed coordinate. If this is `undefined`,
 * the default {@link module:ol/proj.getPointResolution} function will be used.
 */
/**
 * @classdesc
 * In most cases, you should not need to create instances of this class.
 * Instead, where projection information is required, you can use a string
 * projection code or identifier (e.g. `EPSG:4326`) instead of a projection
 * instance.
 *
 * The library includes support for transforming coordinates between the following
 * projections:
 *
 *  WGS 84 / Geographic - Using codes `EPSG:4326`, `CRS:84`, `urn:ogc:def:crs:EPSG:6.6:4326`,
 *    `urn:ogc:def:crs:OGC:1.3:CRS84`, `urn:ogc:def:crs:OGC:2:84`, `http://www.opengis.net/gml/srs/epsg.xml#4326`,
 *    or `urn:x-ogc:def:crs:EPSG:4326`
 *  WGS 84 / Spherical Mercator - Using codes `EPSG:3857`, `EPSG:102100`, `EPSG:102113`, `EPSG:900913`,
 *    `urn:ogc:def:crs:EPSG:6.18:3:3857`, or `http://www.opengis.net/gml/srs/epsg.xml#3857`
 *  WGS 84 / UTM zones - Using codes `EPSG:32601` through `EPSG:32660` for northern zones
 *    and `EPSG:32701` through `EPSG:32760` for southern zones. Note that the built-in UTM transforms
 *    are lower accuracy (with errors on the order of 0.1 m) than those that you might get in a
 *    library like [proj4js](https://github.com/proj4js/proj4js).
 *
 * For additional projection support, or to use higher accuracy transforms than the built-in ones, you can use
 * the [proj4js](https://github.com/proj4js/proj4js) library. With `proj4js`, after adding any new projection
 * definitions, call the {@link module:ol/proj/proj4.register} function.
 *
 * You can use the {@link module:ol/proj.get} function to retrieve a projection instance
 * for one of the registered projections.
 *
 * @api
 */
declare class Projection {
    /**
     * @param {Options} options Projection options.
     */
    constructor(options: Options$q);
    /**
     * @private
     * @type {string}
     */
    private code_;
    /**
     * Units of projected coordinates. When set to `TILE_PIXELS`, a
     * `this.extent_` and `this.worldExtent_` must be configured properly for each
     * tile.
     * @private
     * @type {import("./Units.js").Units}
     */
    private units_;
    /**
     * Validity extent of the projection in projected coordinates. For projections
     * with `TILE_PIXELS` units, this is the extent of the tile in
     * tile pixel space.
     * @private
     * @type {import("../extent.js").Extent}
     */
    private extent_;
    /**
     * Extent of the world in EPSG:4326. For projections with
     * `TILE_PIXELS` units, this is the extent of the tile in
     * projected coordinate space.
     * @private
     * @type {import("../extent.js").Extent}
     */
    private worldExtent_;
    /**
     * @private
     * @type {string}
     */
    private axisOrientation_;
    /**
     * @private
     * @type {boolean}
     */
    private global_;
    /**
     * @private
     * @type {boolean}
     */
    private canWrapX_;
    /**
     * @private
     * @type {GetPointResolution|undefined}
     */
    private getPointResolutionFunc_;
    /**
     * @private
     * @type {import("../tilegrid/TileGrid.js").default}
     */
    private defaultTileGrid_;
    /**
     * @private
     * @type {number|undefined}
     */
    private metersPerUnit_;
    /**
     * @return {boolean} The projection is suitable for wrapping the x-axis
     */
    canWrapX(): boolean;
    /**
     * Get the code for this projection, e.g. 'EPSG:4326'.
     * @return {string} Code.
     * @api
     */
    getCode(): string;
    /**
     * Get the validity extent for this projection.
     * @return {import("../extent.js").Extent} Extent.
     * @api
     */
    getExtent(): Extent;
    /**
     * Get the units of this projection.
     * @return {import("./Units.js").Units} Units.
     * @api
     */
    getUnits(): Units;
    /**
     * Get the amount of meters per unit of this projection.  If the projection is
     * not configured with `metersPerUnit` or a units identifier, the return is
     * `undefined`.
     * @return {number|undefined} Meters.
     * @api
     */
    getMetersPerUnit(): number | undefined;
    /**
     * Get the world extent for this projection.
     * @return {import("../extent.js").Extent} Extent.
     * @api
     */
    getWorldExtent(): Extent;
    /**
     * Get the axis orientation of this projection.
     * Example values are:
     * enu - the default easting, northing, elevation.
     * neu - northing, easting, up - useful for "lat/long" geographic coordinates,
     *     or south orientated transverse mercator.
     * wnu - westing, northing, up - some planetary coordinate systems have
     *     "west positive" coordinate systems
     * @return {string} Axis orientation.
     * @api
     */
    getAxisOrientation(): string;
    /**
     * Is this projection a global projection which spans the whole world?
     * @return {boolean} Whether the projection is global.
     * @api
     */
    isGlobal(): boolean;
    /**
     * Set if the projection is a global projection which spans the whole world
     * @param {boolean} global Whether the projection is global.
     * @api
     */
    setGlobal(global: boolean): void;
    /**
     * @return {import("../tilegrid/TileGrid.js").default} The default tile grid.
     */
    getDefaultTileGrid(): TileGrid;
    /**
     * @param {import("../tilegrid/TileGrid.js").default} tileGrid The default tile grid.
     */
    setDefaultTileGrid(tileGrid: TileGrid): void;
    /**
     * Set the validity extent for this projection.
     * @param {import("../extent.js").Extent} extent Extent.
     * @api
     */
    setExtent(extent: Extent): void;
    /**
     * Set the world extent for this projection.
     * @param {import("../extent.js").Extent} worldExtent World extent
     *     [minlon, minlat, maxlon, maxlat].
     * @api
     */
    setWorldExtent(worldExtent: Extent): void;
    /**
     * Set the getPointResolution function (see {@link module:ol/proj.getPointResolution}
     * for this projection.
     * @param {function(number, import("../coordinate.js").Coordinate):number} func Function
     * @api
     */
    setGetPointResolution(func: (arg0: number, arg1: Coordinate) => number): void;
    /**
     * Get the custom point resolution function for this projection (if set).
     * @return {GetPointResolution|undefined} The custom point
     * resolution function (if set).
     */
    getPointResolutionFunc(): GetPointResolution | undefined;
}

type ReadOptions = {
    /**
     * Projection of the data we are reading.
     * If not provided, the projection will be derived from the data (where possible) or
     * the `dataProjection` of the format is assigned (where set). If the projection
     * can not be derived from the data and if no `dataProjection` is set for a format,
     * the features will not be reprojected.
     */
    dataProjection?: ProjectionLike;
    /**
     * Tile extent in map units of the tile being read.
     * This is only required when reading data with tile pixels as geometry units. When configured,
     * a `dataProjection` with `TILE_PIXELS` as `units` and the tile's pixel extent as `extent` needs to be
     * provided.
     */
    extent?: Extent | undefined;
    /**
     * Projection of the feature geometries
     * created by the format reader. If not provided, features will be returned in the
     * `dataProjection`.
     */
    featureProjection?: ProjectionLike;
};
type WriteOptions = {
    /**
     * Projection of the data we are writing.
     * If not provided, the `dataProjection` of the format is assigned (where set).
     * If no `dataProjection` is set for a format, the features will be returned
     * in the `featureProjection`.
     */
    dataProjection?: ProjectionLike;
    /**
     * Projection of the feature geometries
     * that will be serialized by the format writer. If not provided, geometries are assumed
     * to be in the `dataProjection` if that is set; in other words, they are not transformed.
     */
    featureProjection?: ProjectionLike;
    /**
     * When writing geometries, follow the right-hand
     * rule for linear ring orientation.  This means that polygons will have counter-clockwise
     * exterior rings and clockwise interior rings.  By default, coordinates are serialized
     * as they are provided at construction.  If `true`, the right-hand rule will
     * be applied.  If `false`, the left-hand rule will be applied (clockwise for
     * exterior and counter-clockwise for interior rings).  Note that not all
     * formats support this.  The GeoJSON format does use this property when writing
     * geometries.
     */
    rightHanded?: boolean | undefined;
    /**
     * Maximum number of decimal places for coordinates.
     * Coordinates are stored internally as floats, but floating-point arithmetic can create
     * coordinates with a large number of decimal places, not generally wanted on output.
     * Set a number here to round coordinates. Can also be used to ensure that
     * coordinates read in can be written back out with the same number of decimals.
     * Default is no rounding.
     */
    decimals?: number | undefined;
};
type Type = "arraybuffer" | "json" | "text" | "xml";
/**
 * *
 */
type FeatureToFeatureClass<T extends FeatureLike> = T extends RenderFeature ? typeof RenderFeature : typeof Feature$1;
/**
 * @typedef {Object} ReadOptions
 * @property {import("../proj.js").ProjectionLike} [dataProjection] Projection of the data we are reading.
 * If not provided, the projection will be derived from the data (where possible) or
 * the `dataProjection` of the format is assigned (where set). If the projection
 * can not be derived from the data and if no `dataProjection` is set for a format,
 * the features will not be reprojected.
 * @property {import("../extent.js").Extent} [extent] Tile extent in map units of the tile being read.
 * This is only required when reading data with tile pixels as geometry units. When configured,
 * a `dataProjection` with `TILE_PIXELS` as `units` and the tile's pixel extent as `extent` needs to be
 * provided.
 * @property {import("../proj.js").ProjectionLike} [featureProjection] Projection of the feature geometries
 * created by the format reader. If not provided, features will be returned in the
 * `dataProjection`.
 */
/**
 * @typedef {Object} WriteOptions
 * @property {import("../proj.js").ProjectionLike} [dataProjection] Projection of the data we are writing.
 * If not provided, the `dataProjection` of the format is assigned (where set).
 * If no `dataProjection` is set for a format, the features will be returned
 * in the `featureProjection`.
 * @property {import("../proj.js").ProjectionLike} [featureProjection] Projection of the feature geometries
 * that will be serialized by the format writer. If not provided, geometries are assumed
 * to be in the `dataProjection` if that is set; in other words, they are not transformed.
 * @property {boolean} [rightHanded] When writing geometries, follow the right-hand
 * rule for linear ring orientation.  This means that polygons will have counter-clockwise
 * exterior rings and clockwise interior rings.  By default, coordinates are serialized
 * as they are provided at construction.  If `true`, the right-hand rule will
 * be applied.  If `false`, the left-hand rule will be applied (clockwise for
 * exterior and counter-clockwise for interior rings).  Note that not all
 * formats support this.  The GeoJSON format does use this property when writing
 * geometries.
 * @property {number} [decimals] Maximum number of decimal places for coordinates.
 * Coordinates are stored internally as floats, but floating-point arithmetic can create
 * coordinates with a large number of decimal places, not generally wanted on output.
 * Set a number here to round coordinates. Can also be used to ensure that
 * coordinates read in can be written back out with the same number of decimals.
 * Default is no rounding.
 */
/**
 * @typedef {'arraybuffer' | 'json' | 'text' | 'xml'} Type
 */
/**
 * @typedef {Object} SimpleGeometryObject
 * @property {import('../geom/Geometry.js').Type} type Type.
 * @property {Array<number>} flatCoordinates Flat coordinates.
 * @property {Array<number>|Array<Array<number>>} [ends] Ends or endss.
 * @property {import('../geom/Geometry.js').GeometryLayout} [layout] Layout.
 */
/**
 * @typedef {Array<GeometryObject>} GeometryCollectionObject
 */
/**
 * @typedef {SimpleGeometryObject|GeometryCollectionObject} GeometryObject
 */
/**
 * @typedef {Object} FeatureObject
 * @property {string|number} [id] Id.
 * @property {GeometryObject} [geometry] Geometry.
 * @property {Object<string, *>} [properties] Properties.
 */
/***
 * @template {import('../Feature.js').FeatureLike} T
 * @typedef {T extends RenderFeature ? typeof RenderFeature : typeof Feature} FeatureToFeatureClass
 */
/***
 * @template {import("../Feature.js").FeatureClass} T
 * @typedef {T[keyof T] extends RenderFeature ? RenderFeature : Feature} FeatureClassToFeature
 */
/**
 * @classdesc
 * Abstract base class; normally only used for creating subclasses and not
 * instantiated in apps.
 * Base class for feature formats.
 * {@link module:ol/format/Feature~FeatureFormat} subclasses provide the ability to decode and encode
 * {@link module:ol/Feature~Feature} objects from a variety of commonly used geospatial
 * file formats.  See the documentation for each format for more details.
 *
 * @template {import('../Feature.js').FeatureLike} [FeatureType=import("../Feature.js").default]
 * @abstract
 * @api
 */
declare class FeatureFormat<FeatureType extends FeatureLike = Feature$1<Geometry>> {
    /**
     * @protected
     * @type {import("../proj/Projection.js").default|undefined}
     */
    protected dataProjection: Projection | undefined;
    /**
     * @protected
     * @type {import("../proj/Projection.js").default|undefined}
     */
    protected defaultFeatureProjection: Projection | undefined;
    /**
     * @protected
     * @type {FeatureToFeatureClass<FeatureType>}
     */
    protected featureClass: FeatureToFeatureClass<FeatureType>;
    /**
     * A list media types supported by the format in descending order of preference.
     * @type {Array<string>}
     */
    supportedMediaTypes: Array<string>;
    /**
     * Adds the data projection to the read options.
     * @param {Document|Element|Object|string} source Source.
     * @param {ReadOptions} [options] Options.
     * @return {ReadOptions|undefined} Options.
     * @protected
     */
    protected getReadOptions(source: Document | Element | any | string, options?: ReadOptions): ReadOptions | undefined;
    /**
     * Sets the `dataProjection` on the options, if no `dataProjection`
     * is set.
     * @param {WriteOptions|ReadOptions|undefined} options
     *     Options.
     * @protected
     * @return {WriteOptions|ReadOptions|undefined}
     *     Updated options.
     */
    protected adaptOptions(options: WriteOptions | ReadOptions | undefined): WriteOptions | ReadOptions | undefined;
    /**
     * @abstract
     * @return {Type} The format type.
     */
    getType(): Type;
    /**
     * Read a single feature from a source.
     *
     * @abstract
     * @param {Document|Element|Object|string} source Source.
     * @param {ReadOptions} [options] Read options.
     * @return {FeatureType|Array<FeatureType>} Feature.
     */
    readFeature(source: Document | Element | any | string, options?: ReadOptions): FeatureType | Array<FeatureType>;
    /**
     * Read all features from a source.
     *
     * @abstract
     * @param {Document|Element|ArrayBuffer|Object|string} source Source.
     * @param {ReadOptions} [options] Read options.
     * @return {Array<FeatureType>} Features.
     */
    readFeatures(source: Document | Element | ArrayBuffer | any | string, options?: ReadOptions): Array<FeatureType>;
    /**
     * Read a single geometry from a source.
     *
     * @abstract
     * @param {Document|Element|Object|string} source Source.
     * @param {ReadOptions} [options] Read options.
     * @return {import("../geom/Geometry.js").default} Geometry.
     */
    readGeometry(source: Document | Element | any | string, options?: ReadOptions): Geometry;
    /**
     * Read the projection from a source.
     *
     * @abstract
     * @param {Document|Element|Object|string} source Source.
     * @return {import("../proj/Projection.js").default|undefined} Projection.
     */
    readProjection(source: Document | Element | any | string): Projection | undefined;
    /**
     * Encode a feature in this format.
     *
     * @abstract
     * @param {Feature} feature Feature.
     * @param {WriteOptions} [options] Write options.
     * @return {string|ArrayBuffer} Result.
     */
    writeFeature(feature: Feature$1, options?: WriteOptions): string | ArrayBuffer;
    /**
     * Encode an array of features in this format.
     *
     * @abstract
     * @param {Array<Feature>} features Features.
     * @param {WriteOptions} [options] Write options.
     * @return {string|ArrayBuffer} Result.
     */
    writeFeatures(features: Array<Feature$1>, options?: WriteOptions): string | ArrayBuffer;
    /**
     * Write a single geometry in this format.
     *
     * @abstract
     * @param {import("../geom/Geometry.js").default} geometry Geometry.
     * @param {WriteOptions} [options] Write options.
     * @return {string|ArrayBuffer} Result.
     */
    writeGeometry(geometry: Geometry, options?: WriteOptions): string | ArrayBuffer;
}

/**
 * {@link module :ol/source/Vector~VectorSource} sources use a function of this type to
 * load features.
 *
 * This function takes up to 5 arguments. These are an {@link module :ol/extent~Extent} representing
 * the area to be loaded, a `{number}` representing the resolution (map units per pixel), a
 * {@link module :ol/proj/Projection~Projection} for the projection, an optional success callback that should get
 * the loaded features passed as an argument and an optional failure callback with no arguments. If
 * the callbacks are not used, the corresponding vector source will not fire `'featuresloadend'` and
 * `'featuresloaderror'` events. `this` within the function is bound to the
 * {@link module :ol/source/Vector~VectorSource} it's called from.
 *
 * The function is responsible for loading the features and adding them to the
 * source.
 */
type FeatureLoader<FeatureType extends FeatureLike = FeatureLike> = (extent: Extent, resolution: number, projection: Projection, success?: (features: Array<FeatureType>) => void, failure?: () => void) => void;
/**
 * {@link module :ol/source/Vector~VectorSource} sources use a function of this type to
 * get the url to load features from.
 *
 * This function takes an {@link module :ol/extent~Extent} representing the area
 * to be loaded, a `{number}` representing the resolution (map units per pixel)
 * and an {@link module :ol/proj/Projection~Projection} for the projection  as
 * arguments and returns a `{string}` representing the URL.
 */
type FeatureUrlFunction = (arg0: Extent, arg1: number, arg2: Projection) => string;

type VectorSourceEventTypes = "addfeature" | "changefeature" | "clear" | "removefeature" | "featuresloadstart" | "featuresloadend" | "featuresloaderror";

/**
 * A function that takes an {@link module:ol/extent~Extent} and a resolution as arguments, and
 * returns an array of {@link module:ol/extent~Extent} with the extents to load. Usually this
 * is one of the standard {@link module:ol/loadingstrategy} strategies.
 *
 * @typedef {function(import("../extent.js").Extent, number, import("../proj/Projection.js").default): Array<import("../extent.js").Extent>} LoadingStrategy
 * @api
 */
/**
 * @classdesc
 * Events emitted by {@link module:ol/source/Vector~VectorSource} instances are instances of this
 * type.
 * @template {import("../Feature.js").FeatureLike} [FeatureType=import("../Feature.js").default]
 */
declare class VectorSourceEvent<FeatureType extends FeatureLike = Feature$1<Geometry>> extends BaseEvent {
    /**
     * @param {string} type Type.
     * @param {FeatureType} [feature] Feature.
     * @param {Array<FeatureType>} [features] Features.
     */
    constructor(type: string, feature?: FeatureType, features?: Array<FeatureType>);
    /**
     * The added or removed feature for the `ADDFEATURE` and `REMOVEFEATURE` events, `undefined` otherwise.
     * @type {FeatureType|undefined}
     * @api
     */
    feature: FeatureType | undefined;
    /**
     * The loaded features for the `FEATURESLOADED` event, `undefined` otherwise.
     * @type {Array<FeatureType>|undefined}
     * @api
     */
    features: Array<FeatureType> | undefined;
}

/**
 * A function that takes an {@link module :ol/extent~Extent} and a resolution as arguments, and
 * returns an array of {@link module :ol/extent~Extent} with the extents to load. Usually this
 * is one of the standard {@link module :ol/loadingstrategy} strategies.
 */
type LoadingStrategy = (arg0: Extent, arg1: number, arg2: Projection) => Array<Extent>;
/**
 * *
 */
type FeatureClassOrArrayOfRenderFeatures<T extends FeatureLike = Feature$1<Geometry>> = T extends RenderFeature ? T | Array<T> : T;
/**
 * *
 */
type VectorSourceOnSignature<Return, FeatureType extends FeatureLike = Feature$1<Geometry>> = OnSignature<EventTypes, BaseEvent, Return> & OnSignature<Types$2, ObjectEvent, Return> & OnSignature<VectorSourceEventTypes, VectorSourceEvent<FeatureType>, Return> & CombinedOnSignature<EventTypes | Types$2 | VectorSourceEventTypes, Return>;
type Options$p<FeatureType extends FeatureLike = Feature$1<Geometry>> = {
    /**
     * Attributions.
     */
    attributions?: AttributionLike | undefined;
    /**
     * Features. If provided as {@link module :ol/Collection~Collection}, the features in the source
     * and the collection will stay in sync.
     */
    features?: FeatureType[] | Collection<FeatureType> | undefined;
    /**
     * The feature format used by the XHR
     * feature loader when `url` is set. Required if `url` is set, otherwise ignored.
     */
    format?: FeatureFormat<FeatureType> | undefined;
    /**
     * The loader function used to load features, from a remote source for example.
     * If this is not set and `url` is set, the source will create and use an XHR
     * feature loader. The `'featuresloadend'` and `'featuresloaderror'` events
     * will only fire if the `success` and `failure` callbacks are used.
     *
     * Example:
     *
     * ```js
     * import Vector from 'ol/source/Vector.js';
     * import GeoJSON from 'ol/format/GeoJSON.js';
     * import {bbox} from 'ol/loadingstrategy.js';
     *
     * const vectorSource = new Vector({
     * format: new GeoJSON(),
     * loader: function(extent, resolution, projection, success, failure) {
     * const proj = projection.getCode();
     * const url = 'https://ahocevar.com/geoserver/wfs?service=WFS&' +
     * 'version=1.1.0&request=GetFeature&typename=osm:water_areas&' +
     * 'outputFormat=application/json&srsname=' + proj + '&' +
     * 'bbox=' + extent.join(',') + ',' + proj;
     * const xhr = new XMLHttpRequest();
     * xhr.open('GET', url);
     * const onError = function() {
     * vectorSource.removeLoadedExtent(extent);
     * failure();
     * }
     * xhr.onerror = onError;
     * xhr.onload = function() {
     * if (xhr.status == 200) {
     * const features = vectorSource.getFormat().readFeatures(xhr.responseText);
     * vectorSource.addFeatures(features);
     * success(features);
     * } else {
     * onError();
     * }
     * }
     * xhr.send();
     * },
     * strategy: bbox,
     * });
     * ```
     */
    loader?: FeatureLoader<FeatureType> | undefined;
    /**
     * This source may have overlapping geometries.
     * Setting this to `false` (e.g. for sources with polygons that represent administrative
     * boundaries or TopoJSON sources) allows the renderer to optimise fill and
     * stroke operations.
     */
    overlaps?: boolean | undefined;
    /**
     * The loading strategy to use.
     * By default an {@link module :ol/loadingstrategy.all}strategy is used, a one-off strategy which loads all features at once.
     */
    strategy?: LoadingStrategy | undefined;
    /**
     * Setting this option instructs the source to load features using an XHR loader
     * (see {@link module :ol/featureloader.xhr}). Use a `string` and an
     * {@link module :ol/loadingstrategy.all} for a one-off download of all features from
     * the given URL. Use a {@link module :ol/featureloader~FeatureUrlFunction} to generate the url with
     * other loading strategies.
     * Requires `format` to be set as well.
     * When default XHR feature loader is provided, the features will
     * be transformed from the data projection to the view projection
     * during parsing. If your remote data source does not advertise its projection
     * properly, this transformation will be incorrect. For some formats, the
     * default projection (usually EPSG:4326) can be overridden by setting the
     * dataProjection constructor option on the format.
     * Note that if a source contains non-feature data, such as a GeoJSON geometry
     * or a KML NetworkLink, these will be ignored. Use a custom loader to load these.
     */
    url?: string | FeatureUrlFunction | undefined;
    /**
     * By default, an RTree is used as spatial index. When features are removed and
     * added frequently, and the total number of features is low, setting this to
     * `false` may improve performance.
     *
     * Note that
     * {@link module :ol/source/Vector~VectorSource#getFeaturesInExtent},
     * {@link module :ol/source/Vector~VectorSource#getClosestFeatureToCoordinate} and
     * {@link module :ol/source/Vector~VectorSource#getExtent} cannot be used when `useSpatialIndex` is
     * set to `false`, and {@link module :ol/source/Vector~VectorSource#forEachFeatureInExtent} will loop
     * through all features.
     *
     * When set to `false`, the features will be maintained in an
     * {@link module :ol/Collection~Collection}, which can be retrieved through
     * {@link module :ol/source/Vector~VectorSource#getFeaturesCollection}.
     */
    useSpatialIndex?: boolean | undefined;
    /**
     * Wrap the world horizontally. For vector editing across the
     * -180° and 180° meridians to work properly, this should be set to `false`. The
     * resulting geometry coordinates will then exceed the world bounds.
     */
    wrapX?: boolean | undefined;
};

/***
 * @template {import("../Feature.js").FeatureLike} [T=import("../Feature.js").default]
 * @typedef {T extends RenderFeature ? T|Array<T> : T} FeatureClassOrArrayOfRenderFeatures
 */
/***
 * @template Return
 * @template {import("../Feature.js").FeatureLike} [FeatureType=import("../Feature.js").default]
 * @typedef {import("../Observable").OnSignature<import("../Observable").EventTypes, import("../events/Event.js").default, Return> &
 *   import("../Observable").OnSignature<import("../ObjectEventType").Types, import("../Object").ObjectEvent, Return> &
 *   import("../Observable").OnSignature<import("./VectorEventType").VectorSourceEventTypes, VectorSourceEvent<FeatureType>, Return> &
 *   import("../Observable").CombinedOnSignature<import("../Observable").EventTypes|import("../ObjectEventType").Types|
 *     import("./VectorEventType").VectorSourceEventTypes, Return>} VectorSourceOnSignature
 */
/**
 * @template {import("../Feature.js").FeatureLike} [FeatureType=import("../Feature.js").default]
 * @typedef {Object} Options
 * @property {import("./Source.js").AttributionLike} [attributions] Attributions.
 * @property {Array<FeatureType>|Collection<FeatureType>} [features]
 * Features. If provided as {@link module:ol/Collection~Collection}, the features in the source
 * and the collection will stay in sync.
 * @property {import("../format/Feature.js").default<FeatureType>} [format] The feature format used by the XHR
 * feature loader when `url` is set. Required if `url` is set, otherwise ignored.
 * @property {import("../featureloader.js").FeatureLoader<FeatureType>} [loader]
 * The loader function used to load features, from a remote source for example.
 * If this is not set and `url` is set, the source will create and use an XHR
 * feature loader. The `'featuresloadend'` and `'featuresloaderror'` events
 * will only fire if the `success` and `failure` callbacks are used.
 *
 * Example:
 *
 * ```js
 * import Vector from 'ol/source/Vector.js';
 * import GeoJSON from 'ol/format/GeoJSON.js';
 * import {bbox} from 'ol/loadingstrategy.js';
 *
 * const vectorSource = new Vector({
 *   format: new GeoJSON(),
 *   loader: function(extent, resolution, projection, success, failure) {
 *      const proj = projection.getCode();
 *      const url = 'https://ahocevar.com/geoserver/wfs?service=WFS&' +
 *          'version=1.1.0&request=GetFeature&typename=osm:water_areas&' +
 *          'outputFormat=application/json&srsname=' + proj + '&' +
 *          'bbox=' + extent.join(',') + ',' + proj;
 *      const xhr = new XMLHttpRequest();
 *      xhr.open('GET', url);
 *      const onError = function() {
 *        vectorSource.removeLoadedExtent(extent);
 *        failure();
 *      }
 *      xhr.onerror = onError;
 *      xhr.onload = function() {
 *        if (xhr.status == 200) {
 *          const features = vectorSource.getFormat().readFeatures(xhr.responseText);
 *          vectorSource.addFeatures(features);
 *          success(features);
 *        } else {
 *          onError();
 *        }
 *      }
 *      xhr.send();
 *    },
 *    strategy: bbox,
 *  });
 * ```
 * @property {boolean} [overlaps=true] This source may have overlapping geometries.
 * Setting this to `false` (e.g. for sources with polygons that represent administrative
 * boundaries or TopoJSON sources) allows the renderer to optimise fill and
 * stroke operations.
 * @property {LoadingStrategy} [strategy] The loading strategy to use.
 * By default an {@link module:ol/loadingstrategy.all}
 * strategy is used, a one-off strategy which loads all features at once.
 * @property {string|import("../featureloader.js").FeatureUrlFunction} [url]
 * Setting this option instructs the source to load features using an XHR loader
 * (see {@link module:ol/featureloader.xhr}). Use a `string` and an
 * {@link module:ol/loadingstrategy.all} for a one-off download of all features from
 * the given URL. Use a {@link module:ol/featureloader~FeatureUrlFunction} to generate the url with
 * other loading strategies.
 * Requires `format` to be set as well.
 * When default XHR feature loader is provided, the features will
 * be transformed from the data projection to the view projection
 * during parsing. If your remote data source does not advertise its projection
 * properly, this transformation will be incorrect. For some formats, the
 * default projection (usually EPSG:4326) can be overridden by setting the
 * dataProjection constructor option on the format.
 * Note that if a source contains non-feature data, such as a GeoJSON geometry
 * or a KML NetworkLink, these will be ignored. Use a custom loader to load these.
 * @property {boolean} [useSpatialIndex=true]
 * By default, an RTree is used as spatial index. When features are removed and
 * added frequently, and the total number of features is low, setting this to
 * `false` may improve performance.
 *
 * Note that
 * {@link module:ol/source/Vector~VectorSource#getFeaturesInExtent},
 * {@link module:ol/source/Vector~VectorSource#getClosestFeatureToCoordinate} and
 * {@link module:ol/source/Vector~VectorSource#getExtent} cannot be used when `useSpatialIndex` is
 * set to `false`, and {@link module:ol/source/Vector~VectorSource#forEachFeatureInExtent} will loop
 * through all features.
 *
 * When set to `false`, the features will be maintained in an
 * {@link module:ol/Collection~Collection}, which can be retrieved through
 * {@link module:ol/source/Vector~VectorSource#getFeaturesCollection}.
 * @property {boolean} [wrapX=true] Wrap the world horizontally. For vector editing across the
 * -180° and 180° meridians to work properly, this should be set to `false`. The
 * resulting geometry coordinates will then exceed the world bounds.
 */
/**
 * @classdesc
 * Provides a source of features for vector layers. Vector features provided
 * by this source are suitable for editing. See {@link module:ol/source/VectorTile~VectorTile} for
 * vector data that is optimized for rendering.
 *
 * @fires VectorSourceEvent
 * @api
 * @template {import("../Feature.js").FeatureLike} [FeatureType=import("../Feature.js").default]
 */
declare class VectorSource<FeatureType extends FeatureLike = Feature$1<Geometry>> extends Source {
    /**
     * @param {Options<FeatureType>} [options] Vector source options.
     */
    constructor(options?: Options$p<FeatureType>);
    /***
     * @type {VectorSourceOnSignature<import("../events").EventsKey, FeatureType>}
     */
    on: VectorSourceOnSignature<EventsKey, FeatureType>;
    /***
     * @type {VectorSourceOnSignature<import("../events").EventsKey, FeatureType>}
     */
    once: VectorSourceOnSignature<EventsKey, FeatureType>;
    /***
     * @type {VectorSourceOnSignature<void>}
     */
    un: VectorSourceOnSignature<void>;
    /**
     * @private
     * @type {import("../featureloader.js").FeatureLoader<import("../Feature.js").FeatureLike>}
     */
    private loader_;
    /**
     * @private
     * @type {import("../format/Feature.js").default<FeatureType>|null}
     */
    private format_;
    /**
     * @private
     * @type {boolean}
     */
    private overlaps_;
    /**
     * @private
     * @type {string|import("../featureloader.js").FeatureUrlFunction|undefined}
     */
    private url_;
    /**
     * @private
     * @type {LoadingStrategy}
     */
    private strategy_;
    /**
     * @private
     * @type {RBush<FeatureType>}
     */
    private featuresRtree_;
    /**
     * @private
     * @type {RBush<{extent: import("../extent.js").Extent}>}
     */
    private loadedExtentsRtree_;
    /**
     * @type {number}
     * @private
     */
    private loadingExtentsCount_;
    /**
     * @private
     * @type {!Object<string, FeatureType>}
     */
    private nullGeometryFeatures_;
    /**
     * A lookup of features by id (the return from feature.getId()).
     * @private
     * @type {!Object<string, import('../Feature.js').FeatureLike|Array<import('../Feature.js').FeatureLike>>}
     */
    private idIndex_;
    /**
     * A lookup of features by uid (using getUid(feature)).
     * @private
     * @type {!Object<string, FeatureType>}
     */
    private uidIndex_;
    /**
     * @private
     * @type {Object<string, Array<import("../events.js").EventsKey>>}
     */
    private featureChangeKeys_;
    /**
     * @private
     * @type {Collection<FeatureType>|null}
     */
    private featuresCollection_;
    /**
     * Add a single feature to the source.  If you want to add a batch of features
     * at once, call {@link module:ol/source/Vector~VectorSource#addFeatures #addFeatures()}
     * instead. A feature will not be added to the source if feature with
     * the same id is already there. The reason for this behavior is to avoid
     * feature duplication when using bbox or tile loading strategies.
     * Note: this also applies if a {@link module:ol/Collection~Collection} is used for features,
     * meaning that if a feature with a duplicate id is added in the collection, it will
     * be removed from it right away.
     * @param {FeatureType} feature Feature to add.
     * @api
     */
    addFeature(feature: FeatureType): void;
    /**
     * Add a feature without firing a `change` event.
     * @param {FeatureType} feature Feature.
     * @protected
     */
    protected addFeatureInternal(feature: FeatureType): void;
    /**
     * @param {string} featureKey Unique identifier for the feature.
     * @param {FeatureType} feature The feature.
     * @private
     */
    private setupChangeEvents_;
    /**
     * @param {string} featureKey Unique identifier for the feature.
     * @param {FeatureType} feature The feature.
     * @return {boolean} The feature is "valid", in the sense that it is also a
     *     candidate for insertion into the Rtree.
     * @private
     */
    private addToIndex_;
    /**
     * Add a batch of features to the source.
     * @param {Array<FeatureType>} features Features to add.
     * @api
     */
    addFeatures(features: Array<FeatureType>): void;
    /**
     * Add features without firing a `change` event.
     * @param {Array<FeatureType>} features Features.
     * @protected
     */
    protected addFeaturesInternal(features: Array<FeatureType>): void;
    /**
     * @param {!Collection<FeatureType>} collection Collection.
     * @private
     */
    private bindFeaturesCollection_;
    /**
     * Remove all features from the source.
     * @param {boolean} [fast] Skip dispatching of {@link module:ol/source/Vector.VectorSourceEvent#event:removefeature} events.
     * @api
     */
    clear(fast?: boolean): void;
    /**
     * Iterate through all features on the source, calling the provided callback
     * with each one.  If the callback returns any "truthy" value, iteration will
     * stop and the function will return the same value.
     * Note: this function only iterate through the feature that have a defined geometry.
     *
     * @param {function(FeatureType): T} callback Called with each feature
     *     on the source.  Return a truthy value to stop iteration.
     * @return {T|undefined} The return value from the last call to the callback.
     * @template T
     * @api
     */
    forEachFeature<T>(callback: (arg0: FeatureType) => T): T | undefined;
    /**
     * Iterate through all features whose geometries contain the provided
     * coordinate, calling the callback with each feature.  If the callback returns
     * a "truthy" value, iteration will stop and the function will return the same
     * value.
     *
     * For {@link module:ol/render/Feature~RenderFeature} features, the callback will be
     * called for all features.
     *
     * @param {import("../coordinate.js").Coordinate} coordinate Coordinate.
     * @param {function(FeatureType): T} callback Called with each feature
     *     whose goemetry contains the provided coordinate.
     * @return {T|undefined} The return value from the last call to the callback.
     * @template T
     */
    forEachFeatureAtCoordinateDirect<T>(coordinate: Coordinate, callback: (arg0: FeatureType) => T): T | undefined;
    /**
     * Iterate through all features whose bounding box intersects the provided
     * extent (note that the feature's geometry may not intersect the extent),
     * calling the callback with each feature.  If the callback returns a "truthy"
     * value, iteration will stop and the function will return the same value.
     *
     * If you are interested in features whose geometry intersects an extent, call
     * the {@link module:ol/source/Vector~VectorSource#forEachFeatureIntersectingExtent #forEachFeatureIntersectingExtent()} method instead.
     *
     * When `useSpatialIndex` is set to false, this method will loop through all
     * features, equivalent to {@link module:ol/source/Vector~VectorSource#forEachFeature #forEachFeature()}.
     *
     * @param {import("../extent.js").Extent} extent Extent.
     * @param {function(FeatureType): T} callback Called with each feature
     *     whose bounding box intersects the provided extent.
     * @return {T|undefined} The return value from the last call to the callback.
     * @template T
     * @api
     */
    forEachFeatureInExtent<T>(extent: Extent, callback: (arg0: FeatureType) => T): T | undefined;
    /**
     * Iterate through all features whose geometry intersects the provided extent,
     * calling the callback with each feature.  If the callback returns a "truthy"
     * value, iteration will stop and the function will return the same value.
     *
     * If you only want to test for bounding box intersection, call the
     * {@link module:ol/source/Vector~VectorSource#forEachFeatureInExtent #forEachFeatureInExtent()} method instead.
     *
     * @param {import("../extent.js").Extent} extent Extent.
     * @param {function(FeatureType): T} callback Called with each feature
     *     whose geometry intersects the provided extent.
     * @return {T|undefined} The return value from the last call to the callback.
     * @template T
     * @api
     */
    forEachFeatureIntersectingExtent<T>(extent: Extent, callback: (arg0: FeatureType) => T): T | undefined;
    /**
     * Get the features collection associated with this source. Will be `null`
     * unless the source was configured with `useSpatialIndex` set to `false`, or
     * with a {@link module:ol/Collection~Collection} as `features`.
     * @return {Collection<FeatureType>|null} The collection of features.
     * @api
     */
    getFeaturesCollection(): Collection<FeatureType> | null;
    /**
     * Get a snapshot of the features currently on the source in random order. The returned array
     * is a copy, the features are references to the features in the source.
     * @return {Array<FeatureType>} Features.
     * @api
     */
    getFeatures(): Array<FeatureType>;
    /**
     * Get all features whose geometry intersects the provided coordinate.
     * @param {import("../coordinate.js").Coordinate} coordinate Coordinate.
     * @return {Array<FeatureType>} Features.
     * @api
     */
    getFeaturesAtCoordinate(coordinate: Coordinate): Array<FeatureType>;
    /**
     * Get all features whose bounding box intersects the provided extent.  Note that this returns an array of
     * all features intersecting the given extent in random order (so it may include
     * features whose geometries do not intersect the extent).
     *
     * When `useSpatialIndex` is set to false, this method will return all
     * features.
     *
     * @param {import("../extent.js").Extent} extent Extent.
     * @param {import("../proj/Projection.js").default} [projection] Include features
     * where `extent` exceeds the x-axis bounds of `projection` and wraps around the world.
     * @return {Array<FeatureType>} Features.
     * @api
     */
    getFeaturesInExtent(extent: Extent, projection?: Projection): Array<FeatureType>;
    /**
     * Get the closest feature to the provided coordinate.
     *
     * This method is not available when the source is configured with
     * `useSpatialIndex` set to `false` and the features in this source are of type
     * {@link module:ol/Feature~Feature}.
     * @param {import("../coordinate.js").Coordinate} coordinate Coordinate.
     * @param {function(FeatureType):boolean} [filter] Feature filter function.
     *     The filter function will receive one argument, the {@link module:ol/Feature~Feature feature}
     *     and it should return a boolean value. By default, no filtering is made.
     * @return {FeatureType|null} Closest feature (or `null` if none found).
     * @api
     */
    getClosestFeatureToCoordinate(coordinate: Coordinate, filter?: (arg0: FeatureType) => boolean): FeatureType | null;
    /**
     * Get the extent of the features currently in the source.
     *
     * This method is not available when the source is configured with
     * `useSpatialIndex` set to `false`.
     * @param {import("../extent.js").Extent} [extent] Destination extent. If provided, no new extent
     *     will be created. Instead, that extent's coordinates will be overwritten.
     * @return {import("../extent.js").Extent} Extent.
     * @api
     */
    getExtent(extent?: Extent): Extent;
    /**
     * Get a feature by its identifier (the value returned by feature.getId()). When `RenderFeature`s
     * are used, `getFeatureById()` can return an array of `RenderFeature`s. This allows for handling
     * of `GeometryCollection` geometries, where format readers create one `RenderFeature` per
     * `GeometryCollection` member.
     * Note that the index treats string and numeric identifiers as the same.  So
     * `source.getFeatureById(2)` will return a feature with id `'2'` or `2`.
     *
     * @param {string|number} id Feature identifier.
     * @return {FeatureClassOrArrayOfRenderFeatures<FeatureType>|null} The feature (or `null` if not found).
     * @api
     */
    getFeatureById(id: string | number): FeatureClassOrArrayOfRenderFeatures<FeatureType> | null;
    /**
     * Get a feature by its internal unique identifier (using `getUid`).
     *
     * @param {string} uid Feature identifier.
     * @return {FeatureType|null} The feature (or `null` if not found).
     */
    getFeatureByUid(uid: string): FeatureType | null;
    /**
     * Get the format associated with this source.
     *
     * @return {import("../format/Feature.js").default<FeatureType>|null}} The feature format.
     * @api
     */
    getFormat(): FeatureFormat<FeatureType> | null;
    /**
     * @return {boolean} The source can have overlapping geometries.
     */
    getOverlaps(): boolean;
    /**
     * Get the url associated with this source.
     *
     * @return {string|import("../featureloader.js").FeatureUrlFunction|undefined} The url.
     * @api
     */
    getUrl(): string | FeatureUrlFunction | undefined;
    /**
     * @param {Event} event Event.
     * @private
     */
    private handleFeatureChange_;
    /**
     * Returns true if the feature is contained within the source.
     * @param {FeatureType} feature Feature.
     * @return {boolean} Has feature.
     * @api
     */
    hasFeature(feature: FeatureType): boolean;
    /**
     * @return {boolean} Is empty.
     */
    isEmpty(): boolean;
    /**
     * @param {import("../extent.js").Extent} extent Extent.
     * @param {number} resolution Resolution.
     * @param {import("../proj/Projection.js").default} projection Projection.
     */
    loadFeatures(extent: Extent, resolution: number, projection: Projection): void;
    /**
     * Remove an extent from the list of loaded extents.
     * @param {import("../extent.js").Extent} extent Extent.
     * @api
     */
    removeLoadedExtent(extent: Extent): void;
    /**
     * Batch remove features from the source.  If you want to remove all features
     * at once, use the {@link module:ol/source/Vector~VectorSource#clear #clear()} method
     * instead.
     * @param {Array<FeatureType>} features Features to remove.
     * @api
     */
    removeFeatures(features: Array<FeatureType>): void;
    /**
     * Remove a single feature from the source. If you want to batch remove
     * features, use the {@link module:ol/source/Vector~VectorSource#removeFeatures #removeFeatures()} method
     * instead.
     * @param {FeatureType} feature Feature to remove.
     * @api
     */
    removeFeature(feature: FeatureType): void;
    /**
     * Remove feature without firing a `change` event.
     * @param {FeatureType} feature Feature.
     * @return {boolean} True if the feature was removed, false if it was not found.
     * @protected
     */
    protected removeFeatureInternal(feature: FeatureType): boolean;
    /**
     * Remove a feature from the id index.  Called internally when the feature id
     * may have changed.
     * @param {FeatureType} feature The feature.
     * @private
     */
    private removeFromIdIndex_;
    /**
     * Set the new loader of the source. The next render cycle will use the
     * new loader.
     * @param {import("../featureloader.js").FeatureLoader} loader The loader to set.
     * @api
     */
    setLoader(loader: FeatureLoader): void;
    /**
     * Points the source to a new url. The next render cycle will use the new url.
     * @param {string|import("../featureloader.js").FeatureUrlFunction} url Url.
     * @api
     */
    setUrl(url: string | FeatureUrlFunction): void;
    /**
     * @param {boolean} overlaps The source can have overlapping geometries.
     */
    setOverlaps(overlaps: boolean): void;
}

type EncodedExpression = LiteralValue | any[];
/**
 * Base type used for literal style parameters; can be a number literal or the output of an operator,
 * which in turns takes {@link import ("./expression.js").ExpressionValue} arguments.
 *
 * See below for details on the available operators (with notes for those that are WebGL or Canvas only).
 *
 * Reading operators:
 *   * `['band', bandIndex, xOffset, yOffset]` For tile layers only. Fetches pixel values from band
 *     `bandIndex` of the source's data. The first `bandIndex` of the source data is `1`. Fetched values
 *     are in the 0..1 range. {@link import ("../source/TileImage.js").default} sources have 4 bands: red,
 *     green, blue and alpha. {@link import ("../source/DataTile.js").default} sources can have any number
 *     of bands, depending on the underlying data source and
 *     {@link import ("../source/GeoTIFF.js").Options configuration}. `xOffset` and `yOffset` are optional
 *     and allow specifying pixel offsets for x and y. This is used for sampling data from neighboring pixels (WebGL only).
 *   * `['get', attributeName]` fetches a feature property value, similar to `feature.get('attributeName')`.
 *   * `['get', attributeName, keyOrArrayIndex, ...]` (Canvas only) Access nested properties and array items of a
 *     feature property. The result is `undefined` when there is nothing at the specified key or index.
 *   * `['geometry-type']` returns a feature's geometry type as string, either: 'LineString', 'Point' or 'Polygon'
 *     `Multi*` values are returned as their singular equivalent
 *     `Circle` geometries are returned as 'Polygon'
 *     `GeometryCollection` geometries are returned as the type of the first geometry found in the collection (WebGL only).
 *   * `['resolution']` returns the current resolution
 *   * `['time']` The time in seconds since the creation of the layer (WebGL only).
 *   * `['var', 'varName']` fetches a value from the style variables; will throw an error if that variable is undefined
 *   * `['zoom']` The current zoom level (WebGL only).
 *   * `['line-metric']` returns the M component of the current point on a line (WebGL only); in case where the geometry layout of the line
 *      does not contain an M component (e.g. XY or XYZ), 0 is returned; 0 is also returned for geometries other than lines.
 *      Please note that the M component will be linearly interpolated between the two points composing a segment.
 *
 * Math operators:
 *   * `['*', value1, value2, ...]` multiplies the values (either numbers or colors)
 *   * `['/', value1, value2]` divides `value1` by `value2`
 *   * `['+', value1, value2, ...]` adds the values
 *   * `['-', value1, value2]` subtracts `value2` from `value1`
 *   * `['clamp', value, low, high]` clamps `value` between `low` and `high`
 *   * `['%', value1, value2]` returns the result of `value1 % value2` (modulo)
 *   * `['^', value1, value2]` returns the value of `value1` raised to the `value2` power
 *   * `['abs', value1]` returns the absolute value of `value1`
 *   * `['floor', value1]` returns the nearest integer less than or equal to `value1`
 *   * `['round', value1]` returns the nearest integer to `value1`
 *   * `['ceil', value1]` returns the nearest integer greater than or equal to `value1`
 *   * `['sin', value1]` returns the sine of `value1`
 *   * `['cos', value1]` returns the cosine of `value1`
 *   * `['atan', value1, value2]` returns `atan2(value1, value2)`. If `value2` is not provided, returns `atan(value1)`
 *   * `['sqrt', value1]` returns the square root of `value1`
 *
 * * Transform operators:
 *   * `['case', condition1, output1, ...conditionN, outputN, fallback]` selects the first output whose corresponding
 *     condition evaluates to `true`. If no match is found, returns the `fallback` value.
 *     All conditions should be `boolean`, output and fallback can be any kind.
 *   * `['match', input, match1, output1, ...matchN, outputN, fallback]` compares the `input` value against all
 *     provided `matchX` values, returning the output associated with the first valid match. If no match is found,
 *     returns the `fallback` value.
 *     `input` and `matchX` values must all be of the same type, and can be `number` or `string`. `outputX` and
 *     `fallback` values must be of the same type, and can be of any kind.
 *   * `['interpolate', interpolation, input, stop1, output1, ...stopN, outputN]` returns a value by interpolating between
 *     pairs of inputs and outputs; `interpolation` can either be `['linear']` or `['exponential', base]` where `base` is
 *     the rate of increase from stop A to stop B (i.e. power to which the interpolation ratio is raised); a value
 *     of 1 is equivalent to `['linear']`.
 *     `input` and `stopX` values must all be of type `number`. `outputX` values can be `number` or `color` values.
 *     Note: `input` will be clamped between `stop1` and `stopN`, meaning that all output values will be comprised
 *     between `output1` and `outputN`.
 *   * `['string', value1, value2, ...]` returns the first value in the list that evaluates to a string.
 *     An example would be to provide a default value for get: `['string', ['get', 'propertyname'], 'default value']]`
 *     (Canvas only).
 *   * `['number', value1, value2, ...]` returns the first value in the list that evaluates to a number.
 *     An example would be to provide a default value for get: `['string', ['get', 'propertyname'], 42]]`
 *     (Canvas only).
 *   * `['coalesce', value1, value2, ...]` returns the first value in the list which is not null or undefined.
 *     An example would be to provide a default value for get: `['coalesce', ['get','propertyname'], 'default value']]`
 *     (Canvas only).
 *
 * * Logical operators:
 *   * `['<', value1, value2]` returns `true` if `value1` is strictly lower than `value2`, or `false` otherwise.
 *   * `['<=', value1, value2]` returns `true` if `value1` is lower than or equals `value2`, or `false` otherwise.
 *   * `['>', value1, value2]` returns `true` if `value1` is strictly greater than `value2`, or `false` otherwise.
 *   * `['>=', value1, value2]` returns `true` if `value1` is greater than or equals `value2`, or `false` otherwise.
 *   * `['==', value1, value2]` returns `true` if `value1` equals `value2`, or `false` otherwise.
 *   * `['!=', value1, value2]` returns `true` if `value1` does not equal `value2`, or `false` otherwise.
 *   * `['!', value1]` returns `false` if `value1` is `true` or greater than `0`, or `true` otherwise.
 *   * `['all', value1, value2, ...]` returns `true` if all the inputs are `true`, `false` otherwise.
 *   * `['any', value1, value2, ...]` returns `true` if any of the inputs are `true`, `false` otherwise.
 *   * `['has', attributeName, keyOrArrayIndex, ...]` returns `true` if feature properties include the (nested) key `attributeName`,
 *     `false` otherwise.
 *     Note that for WebGL layers, the hardcoded value `-9999999` is used to distinguish when a property is not defined.
 *   * `['between', value1, value2, value3]` returns `true` if `value1` is contained between `value2` and `value3`
 *     (inclusively), or `false` otherwise.
 *   * `['in', needle, haystack]` returns `true` if `needle` is found in `haystack`, and
 *     `false` otherwise.
 *     This operator has the following limitations:
 *     * `haystack` has to be an array of numbers or strings (searching for a substring in a string is not supported yet)
 *     * Only literal arrays are supported as `haystack` for now; this means that `haystack` cannot be the result of an
 *     expression. If `haystack` is an array of strings, use the `literal` operator to disambiguate from an expression:
 *     `['literal', ['abc', 'def', 'ghi']]`
 *
 * * Conversion operators:
 *   * `['array', value1, ...valueN]` creates a numerical array from `number` values; please note that the amount of
 *     values can currently only be 2, 3 or 4 (WebGL only).
 *   * `['color', red, green, blue, alpha]` or `['color', shade, alpha]` creates a `color` value from `number` values;
 *     the `alpha` parameter is optional; if not specified, it will be set to 1 (WebGL only).
 *     Note: `red`, `green` and `blue` or `shade` components must be values between 0 and 255; `alpha` between 0 and 1.
 *   * `['palette', index, colors]` picks a `color` value from an array of colors using the given index; the `index`
 *     expression must evaluate to a number; the items in the `colors` array must be strings with hex colors
 *     (e.g. `'#86A136'`), colors using the rgba[a] functional notation (e.g. `'rgb(134, 161, 54)'` or `'rgba(134, 161, 54, 1)'`),
 *     named colors (e.g. `'red'`), or array literals with 3 ([r, g, b]) or 4 ([r, g, b, a]) values (with r, g, and b
 *     in the 0-255 range and a in the 0-1 range) (WebGL only).
 *   * `['to-string', value]` converts the input value to a string. If the input is a boolean, the result is "true" or "false".
 *     If the input is a number, it is converted to a string as specified by the "NumberToString" algorithm of the ECMAScript
 *     Language Specification. If the input is a color, it is converted to a string of the form "rgba(r,g,b,a)". (Canvas only)
 *
 * Values can either be literals or another operator, as they will be evaluated recursively.
 * Literal values can be of the following types:
 * * `boolean`
 * * `number`
 * * `number[]` (number arrays can only have a length of 2, 3 or 4)
 * * `string`
 * * {@link module :ol/color~Color}
 */
type ExpressionValue = Array<any> | Color | string | number | boolean;
type LiteralValue = boolean | number | string | Array<number>;

/**
 * Anchor unit can be either a fraction of the icon size or in pixels.
 */
type IconAnchorUnits = "fraction" | "pixels";
/**
 * Icon origin. One of 'bottom-left', 'bottom-right', 'top-left', 'top-right'.
 */
type IconOrigin = "bottom-left" | "bottom-right" | "top-left" | "top-right";

/**
 * A literal boolean (e.g. `true`) or an expression that evaluates to a boolean (e.g. `['>', ['get', 'population'], 1_000_000]`).
 */
type BooleanExpression = boolean | any[];
/**
 * A literal string (e.g. `'hello'`) or an expression that evaluates to a string (e.g. `['get', 'greeting']`).
 */
type StringExpression = string | any[];
/**
 * A literal number (e.g. `42`) or an expression that evaluates to a number (e.g. `['+', 40, 2]`).
 */
type NumberExpression = number | any[];
/**
 * A CSS named color (e.g. `'blue'`), an array of 3 RGB values (e.g. `[0, 255, 0]`), an array of 4 RGBA values
 * (e.g. `[0, 255, 0, 0.5]`), or an expression that evaluates to one of these color types (e.g. `['get', 'color']`).
 */
type ColorExpression = Color | string | any[];
/**
 * An array of numbers (e.g. `[1, 2, 3]`) or an expression that evaluates to the same (e.g. `['get', 'values']`).
 */
type NumberArrayExpression = Array<number> | any[];
/**
 * An array of two numbers (e.g. `[10, 20]`) or an expression that evaluates to the same (e.g. `['get', 'size']`).
 */
type SizeExpression = number | Array<number> | any[];
/**
 * For static styling, the [layer.setStyle()]{@link module :ol/layer/Vector~VectorLayer#setStyle} method
 * can be called with an object literal that has fill, stroke, text, icon, regular shape, and/or circle properties.
 */
type FlatStyle = FlatFill & FlatStroke & FlatText & FlatIcon & FlatShape & FlatCircle;
/**
 * A flat style literal or an array of the same.
 */
type FlatStyleLike$1 = FlatStyle | Array<FlatStyle> | Array<Rule>;
/**
 * Fill style properties applied to polygon features.
 */
type FlatFill = {
    /**
     * The fill color. `'none'` means no fill and no hit detection (applies to Canvas only).
     */
    "fill-color"?: ColorExpression | undefined;
    /**
     * Fill pattern image source URI. If `fill-color` is defined as well,
     * it will be used to tint this image. (Expressions only in Canvas)
     */
    "fill-pattern-src"?: StringExpression | undefined;
    /**
     * Fill pattern image size in pixels.
     * Can be used together with `fill-pattern-offset` to define the sub-rectangle to use
     * from a fill pattern image sprite sheet.
     */
    "fill-pattern-size"?: SizeExpression | undefined;
    /**
     * Offset, which, together with the size and the offset origin, define the
     * sub-rectangle to use from the original fill pattern image.
     */
    "fill-pattern-offset"?: SizeExpression | undefined;
    /**
     * Origin of the offset: `bottom-left`, `bottom-right`,
     * `top-left` or `top-right`. (WebGL only)
     */
    "fill-pattern-offset-origin"?: IconOrigin | undefined;
};
/**
 * Stroke style properties applied to line strings and polygon boundaries. To apply a stroke, at least one of
 * `stroke-color` or `stroke-width` must be provided.
 */
type FlatStroke = {
    /**
     * The stroke color.
     */
    "stroke-color"?: ColorExpression | undefined;
    /**
     * Stroke pixel width.
     */
    "stroke-width"?: NumberExpression | undefined;
    /**
     * Line cap style: `butt`, `round`, or `square`.
     */
    "stroke-line-cap"?: StringExpression | undefined;
    /**
     * Line join style: `bevel`, `round`, or `miter`.
     */
    "stroke-line-join"?: StringExpression | undefined;
    /**
     * Line dash pattern.
     */
    "stroke-line-dash"?: NumberArrayExpression | undefined;
    /**
     * Line dash offset.
     */
    "stroke-line-dash-offset"?: NumberExpression | undefined;
    /**
     * Miter limit.
     */
    "stroke-miter-limit"?: NumberExpression | undefined;
    /**
     * Stroke offset in pixel along the normal. A positive value offsets the line to the right,
     * relative to the direction of the line. (WebGL only)
     */
    "stroke-offset"?: NumberExpression | undefined;
    /**
     * Stroke pattern image source URI. If `stroke-color` is defined as well,
     * it will be used to tint this image. (WebGL only)
     */
    "stroke-pattern-src"?: string | undefined;
    /**
     * Offset, which, together with the size and the offset origin,
     * define the sub-rectangle to use from the original stroke pattern image. (WebGL only)
     */
    "stroke-pattern-offset"?: SizeExpression | undefined;
    /**
     * Origin of the offset: `bottom-left`, `bottom-right`,
     * `top-left` or `top-right`. (WebGL only)
     */
    "stroke-pattern-offset-origin"?: IconOrigin | undefined;
    /**
     * Stroke pattern image size in pixel. Can be used together with `stroke-pattern-offset` to define the
     * sub-rectangle to use from the origin (sprite) fill pattern image. (WebGL only)
     */
    "stroke-pattern-size"?: SizeExpression | undefined;
    /**
     * Spacing between each pattern occurrence in pixels; 0 if undefined. (WebGL only)
     */
    "stroke-pattern-spacing"?: NumberExpression | undefined;
    /**
     * Stroke pattern offset in pixels at the start of the line. (WebGL only)
     */
    "stroke-pattern-start-offset"?: NumberExpression | undefined;
    /**
     * The zIndex of the style.
     */
    "z-index"?: NumberExpression | undefined;
};
/**
 * Label style properties applied to all features. At a minimum, a `text-value` must be provided.
 * Note: text style is currently not supported in WebGL layers
 */
type FlatText = {
    /**
     * Text content (with `\n` for line breaks).
     */
    "text-value"?: StringExpression | undefined;
    /**
     * Font style as [CSS `font`](https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/font) value.
     */
    "text-font"?: StringExpression | undefined;
    /**
     * When `text-placement` is set to `'line'`, allow a maximum angle between adjacent characters.
     * The expected value is in radians, and the default is 45° (`Math.PI / 4`).
     */
    "text-max-angle"?: NumberExpression | undefined;
    /**
     * Horizontal text offset in pixels. A positive will shift the text right.
     */
    "text-offset-x"?: NumberExpression | undefined;
    /**
     * Vertical text offset in pixels. A positive will shift the text down.
     */
    "text-offset-y"?: NumberExpression | undefined;
    /**
     * For polygon labels or when `placement` is set to `'line'`, allow text to exceed
     * the width of the polygon at the label position or the length of the path that it follows.
     */
    "text-overflow"?: BooleanExpression | undefined;
    /**
     * Text placement.
     */
    "text-placement"?: StringExpression | undefined;
    /**
     * Repeat interval in pixels. When set, the text will be repeated at this interval. Only available when
     * `text-placement` is set to `'line'`. Overrides `text-align`.
     */
    "text-repeat"?: NumberExpression | undefined;
    /**
     * Scale.
     */
    "text-scale"?: SizeExpression | undefined;
    /**
     * Whether to rotate the text with the view.
     */
    "text-rotate-with-view"?: BooleanExpression | undefined;
    /**
     * Rotation in radians (positive rotation clockwise).
     */
    "text-rotation"?: NumberExpression | undefined;
    /**
     * Text alignment. Possible values: `'left'`, `'right'`, `'center'`, `'end'` or `'start'`.
     * Default is `'center'` for `'text-placement': 'point'`. For `'text-placement': 'line'`, the default is to let the renderer choose a
     * placement where `text-max-angle` is not exceeded.
     */
    "text-align"?: StringExpression | undefined;
    /**
     * Text justification within the text box.
     * If not set, text is justified towards the `textAlign` anchor.
     * Otherwise, use options `'left'`, `'center'`, or `'right'` to justify the text within the text box.
     * **Note:** `text-justify` is ignored for immediate rendering and also for `'text-placement': 'line'`.
     */
    "text-justify"?: StringExpression | undefined;
    /**
     * Text base line. Possible values: `'bottom'`, `'top'`, `'middle'`, `'alphabetic'`,
     * `'hanging'`, `'ideographic'`.
     */
    "text-baseline"?: StringExpression | undefined;
    /**
     * Padding in pixels around the text for decluttering and background. The order of
     * values in the array is `[top, right, bottom, left]`.
     */
    "text-padding"?: NumberArrayExpression | undefined;
    /**
     * The fill color. `'none'` means no fill and no hit detection.
     */
    "text-fill-color"?: ColorExpression | undefined;
    /**
     * The fill color. `'none'` means no fill and no hit detection.
     */
    "text-background-fill-color"?: ColorExpression | undefined;
    /**
     * The stroke color.
     */
    "text-stroke-color"?: ColorExpression | undefined;
    /**
     * Line cap style: `butt`, `round`, or `square`.
     */
    "text-stroke-line-cap"?: StringExpression | undefined;
    /**
     * Line join style: `bevel`, `round`, or `miter`.
     */
    "text-stroke-line-join"?: StringExpression | undefined;
    /**
     * Line dash pattern.
     */
    "text-stroke-line-dash"?: NumberArrayExpression | undefined;
    /**
     * Line dash offset.
     */
    "text-stroke-line-dash-offset"?: NumberExpression | undefined;
    /**
     * Miter limit.
     */
    "text-stroke-miter-limit"?: NumberExpression | undefined;
    /**
     * Stroke pixel width.
     */
    "text-stroke-width"?: NumberExpression | undefined;
    /**
     * The stroke color.
     */
    "text-background-stroke-color"?: ColorExpression | undefined;
    /**
     * Line cap style: `butt`, `round`, or `square`.
     */
    "text-background-stroke-line-cap"?: StringExpression | undefined;
    /**
     * Line join style: `bevel`, `round`, or `miter`.
     */
    "text-background-stroke-line-join"?: StringExpression | undefined;
    /**
     * Line dash pattern.
     */
    "text-background-stroke-line-dash"?: NumberArrayExpression | undefined;
    /**
     * Line dash offset.
     */
    "text-background-stroke-line-dash-offset"?: NumberExpression | undefined;
    /**
     * Miter limit.
     */
    "text-background-stroke-miter-limit"?: NumberExpression | undefined;
    /**
     * Stroke pixel width.
     */
    "text-background-stroke-width"?: NumberExpression | undefined;
    /**
     * Declutter mode
     */
    "text-declutter-mode"?: DeclutterMode | undefined;
    /**
     * The zIndex of the style.
     */
    "z-index"?: NumberExpression | undefined;
};
/**
 * Icon style properties applied to point features. `icon-src` must be provided to render
 * points with an icon.
 */
type FlatIcon = {
    /**
     * Image source URI.
     */
    "icon-src"?: string | undefined;
    /**
     * Anchor. Default value is the icon center.
     */
    "icon-anchor"?: NumberArrayExpression | undefined;
    /**
     * Origin of the anchor: `bottom-left`, `bottom-right`,
     * `top-left` or `top-right`.
     */
    "icon-anchor-origin"?: IconOrigin | undefined;
    /**
     * Units in which the anchor x value is
     * specified. A value of `'fraction'` indicates the x value is a fraction of the icon. A value of `'pixels'` indicates
     * the x value in pixels.
     */
    "icon-anchor-x-units"?: IconAnchorUnits | undefined;
    /**
     * Units in which the anchor y value is
     * specified. A value of `'fraction'` indicates the y value is a fraction of the icon. A value of `'pixels'` indicates
     * the y value in pixels.
     */
    "icon-anchor-y-units"?: IconAnchorUnits | undefined;
    /**
     * Color to tint the icon. If not specified,
     * the icon will be left as is.
     */
    "icon-color"?: ColorExpression | undefined;
    /**
     * The `crossOrigin` attribute for loaded images. Note that you must provide a
     * `icon-cross-origin` value if you want to access pixel data with the Canvas renderer.
     * See https://developer.mozilla.org/en-US/docs/Web/HTML/CORS_enabled_image for more detail.
     */
    "icon-cross-origin"?: string | null | undefined;
    /**
     * Offset, which, together with the size and the offset origin, define the
     * sub-rectangle to use from the original icon image.
     */
    "icon-offset"?: SizeExpression | undefined;
    /**
     * Displacement of the icon.
     */
    "icon-displacement"?: NumberArrayExpression | undefined;
    /**
     * Origin of the offset: `bottom-left`, `bottom-right`,
     * `top-left` or `top-right`.
     */
    "icon-offset-origin"?: IconOrigin | undefined;
    /**
     * Opacity of the icon.
     */
    "icon-opacity"?: NumberExpression | undefined;
    /**
     * Scale.
     */
    "icon-scale"?: SizeExpression | undefined;
    /**
     * Width of the icon. If not specified, the actual image width will be used. Cannot be combined
     * with `scale`. (Expressions only in WebGL)
     */
    "icon-width"?: NumberExpression | undefined;
    /**
     * Height of the icon. If not specified, the actual image height will be used. Cannot be combined
     * with `scale`. (Expressions only in WebGL)
     */
    "icon-height"?: NumberExpression | undefined;
    /**
     * Rotation in radians (positive rotation clockwise).
     */
    "icon-rotation"?: NumberExpression | undefined;
    /**
     * Whether to rotate the icon with the view. (Expressions only supported in Canvas)
     */
    "icon-rotate-with-view"?: BooleanExpression | undefined;
    /**
     * Icon size in pixel. Can be used together with `icon-offset` to define the
     * sub-rectangle to use from the origin (sprite) icon image. (Expressions only in WebGL)
     */
    "icon-size"?: SizeExpression | undefined;
    /**
     * Declutter mode (Canvas only)
     */
    "icon-declutter-mode"?: DeclutterMode | undefined;
    /**
     * The zIndex of the style. (Canvas only)
     */
    "z-index"?: NumberExpression | undefined;
};
/**
 * Regular shape style properties for rendering point features. At least `shape-points` must be provided.
 */
type FlatShape = {
    /**
     * Number of points for stars and regular polygons. In case of a polygon, the number of points
     * is the number of sides. (Expressions only in WebGL)
     */
    "shape-points"?: NumberExpression | undefined;
    /**
     * The fill color. `'none'` means no fill and no hit detection.
     */
    "shape-fill-color"?: ColorExpression | undefined;
    /**
     * The stroke color.
     */
    "shape-stroke-color"?: ColorExpression | undefined;
    /**
     * Stroke pixel width.
     */
    "shape-stroke-width"?: NumberExpression | undefined;
    /**
     * Line cap style: `butt`, `round`, or `square`. (Canvas only)
     */
    "shape-stroke-line-cap"?: StringExpression | undefined;
    /**
     * Line join style: `bevel`, `round`, or `miter`. (Canvas only)
     */
    "shape-stroke-line-join"?: StringExpression | undefined;
    /**
     * Line dash pattern. (Canvas only)
     */
    "shape-stroke-line-dash"?: NumberArrayExpression | undefined;
    /**
     * Line dash offset. (Canvas only)
     */
    "shape-stroke-line-dash-offset"?: NumberExpression | undefined;
    /**
     * Miter limit. (Canvas only)
     */
    "shape-stroke-miter-limit"?: NumberExpression | undefined;
    /**
     * Radius of a regular polygon. (Expressions only in WebGL)
     */
    "shape-radius"?: NumberExpression | undefined;
    /**
     * Second radius to make a star instead of a regular polygon. (Expressions only in WebGL)
     */
    "shape-radius2"?: NumberExpression | undefined;
    /**
     * Shape's angle in radians. A value of 0 will have one of the shape's point facing up. (Expressions only in WebGL)
     */
    "shape-angle"?: NumberExpression | undefined;
    /**
     * Displacement of the shape
     */
    "shape-displacement"?: NumberArrayExpression | undefined;
    /**
     * Shape opacity. (WebGL only)
     */
    "shape-opacity"?: NumberExpression | undefined;
    /**
     * Rotation in radians (positive rotation clockwise).
     */
    "shape-rotation"?: NumberExpression | undefined;
    /**
     * Whether to rotate the shape with the view. (Expression only supported in Canvas)
     */
    "shape-rotate-with-view"?: BooleanExpression | undefined;
    /**
     * Scale. Unless two-dimensional scaling is required a better
     * result may be obtained with appropriate settings for `shape-radius` and `shape-radius2`.
     */
    "shape-scale"?: SizeExpression | undefined;
    /**
     * Declutter mode. (Canvas only)
     */
    "shape-declutter-mode"?: DeclutterMode | undefined;
    /**
     * The zIndex of the style. (Canvas only)
     */
    "z-index"?: NumberExpression | undefined;
};
/**
 * Circle style properties for rendering point features. At least `circle-radius` must be provided.
 */
type FlatCircle = {
    /**
     * Circle radius.
     */
    "circle-radius"?: NumberExpression | undefined;
    /**
     * The fill color. `'none'` means no fill and no hit detection.
     */
    "circle-fill-color"?: ColorExpression | undefined;
    /**
     * The stroke color.
     */
    "circle-stroke-color"?: ColorExpression | undefined;
    /**
     * Stroke pixel width.
     */
    "circle-stroke-width"?: NumberExpression | undefined;
    /**
     * Line cap style: `butt`, `round`, or `square`. (Canvas only)
     */
    "circle-stroke-line-cap"?: StringExpression | undefined;
    /**
     * Line join style: `bevel`, `round`, or `miter`. (Canvas only)
     */
    "circle-stroke-line-join"?: StringExpression | undefined;
    /**
     * Line dash pattern. (Canvas only)
     */
    "circle-stroke-line-dash"?: NumberArrayExpression | undefined;
    /**
     * Line dash offset. (Canvas only)
     */
    "circle-stroke-line-dash-offset"?: NumberExpression | undefined;
    /**
     * Miter limit. (Canvas only)
     */
    "circle-stroke-miter-limit"?: NumberExpression | undefined;
    /**
     * displacement
     */
    "circle-displacement"?: NumberArrayExpression | undefined;
    /**
     * Scale. A two-dimensional scale will produce an ellipse.
     * Unless two-dimensional scaling is required a better result may be obtained with an appropriate setting for `circle-radius`.
     */
    "circle-scale"?: SizeExpression | undefined;
    /**
     * Circle opacity. (WebGL only)
     */
    "circle-opacity"?: NumberExpression | undefined;
    /**
     * Rotation in radians
     * (positive rotation clockwise, meaningful only when used in conjunction with a two-dimensional scale).
     */
    "circle-rotation"?: NumberExpression | undefined;
    /**
     * Whether to rotate the shape with the view (Expression only supported in Canvas)
     * (meaningful only when used in conjunction with a two-dimensional scale).
     */
    "circle-rotate-with-view"?: BooleanExpression | undefined;
    /**
     * Declutter mode (Canvas only)
     */
    "circle-declutter-mode"?: DeclutterMode | undefined;
    /**
     * The zIndex of the style. (Canvas only)
     */
    "z-index"?: NumberExpression | undefined;
};
/**
 * A rule is used to conditionally apply a style. If the rule's filter evaluates to true,
 * the style will be applied.
 */
type Rule = {
    /**
     * The style to be applied if the filter matches.
     */
    style: FlatStyle | Array<FlatStyle>;
    /**
     * The filter used
     * to determine if a style applies. If no filter is included, the rule always applies
     * (unless it is an else rule).
     */
    filter?: EncodedExpression | undefined;
    /**
     * If true, the rule applies only if no other previous rule applies.
     * If the else rule also has a filter, the rule will not apply if the filter does not match.
     */
    else?: boolean | undefined;
};
/**
 * Style variables are provided as an object. The variables can be read in a {@link import ("../expr/expression.js").ExpressionValue style expression}
 * using the `['var', 'varName']` operator.
 * Each variable must hold a literal value (not an expression).
 */
type StyleVariables = {
    [x: string]: string | number | boolean | number[];
};

/**
 * @classdesc
 * This class is a wrapper around the association of both a `WebGLTexture` and a `WebGLFramebuffer` instances,
 * simplifying initialization and binding for rendering.
 */
declare class WebGLRenderTarget {
    /**
     * @param {import("./Helper.js").default} helper WebGL helper; mandatory.
     * @param {Array<number>} [size] Expected size of the render target texture; note: this can be changed later on.
     */
    constructor(helper: WebGLHelper, size?: Array<number>);
    /**
     * @private
     * @type {import("./Helper.js").default}
     */
    private helper_;
    /**
     * @private
     * @type {WebGLTexture}
     */
    private texture_;
    /**
     * @private
     * @type {WebGLFramebuffer}
     */
    private framebuffer_;
    /**
     * @private
     * @type {WebGLRenderbuffer}
     */
    private depthbuffer_;
    /**
     * @type {Array<number>}
     * @private
     */
    private size_;
    /**
     * @type {Uint8Array}
     * @private
     */
    private data_;
    /**
     * @type {boolean}
     * @private
     */
    private dataCacheDirty_;
    /**
     * Changes the size of the render target texture. Note: will do nothing if the size
     * is already the same.
     * @param {Array<number>} size Expected size of the render target texture
     */
    setSize(size: Array<number>): void;
    /**
     * Returns the size of the render target texture
     * @return {Array<number>} Size of the render target texture
     */
    getSize(): Array<number>;
    /**
     * This will cause following calls to `#readAll` or `#readPixel` to download the content of the
     * render target into memory, which is an expensive operation.
     * This content will be kept in cache but should be cleared after each new render.
     */
    clearCachedData(): void;
    /**
     * Returns the full content of the frame buffer as a series of r, g, b, a components
     * in the 0-255 range (unsigned byte).
     * @return {Uint8Array} Integer array of color values
     */
    readAll(): Uint8Array;
    /**
     * Reads one pixel of the frame buffer as an array of r, g, b, a components
     * in the 0-255 range (unsigned byte).
     * If x and/or y are outside of existing data, an array filled with 0 is returned.
     * @param {number} x Pixel coordinate
     * @param {number} y Pixel coordinate
     * @return {Uint8Array} Integer array with one color value (4 components)
     */
    readPixel(x: number, y: number): Uint8Array;
    /**
     * @return {WebGLTexture} Texture to render to
     */
    getTexture(): WebGLTexture;
    /**
     * @return {WebGLFramebuffer} Frame buffer of the render target
     */
    getFramebuffer(): WebGLFramebuffer;
    /**
     * @return {WebGLRenderbuffer} Depth buffer of the render target
     */
    getDepthbuffer(): WebGLRenderbuffer;
    /**
     * @private
     */
    private updateSize_;
}
//# sourceMappingURL=RenderTarget.d.ts.map

/**
 * @classdesc
 * Object used to store an array of data as well as usage information for that data.
 * Stores typed arrays internally, either Float32Array or Uint16/32Array depending on
 * the buffer type (ARRAY_BUFFER or ELEMENT_ARRAY_BUFFER) and available extensions.
 *
 * To populate the array, you can either use:
 * A size using `#ofSize(buffer)`
 * An `ArrayBuffer` object using `#fromArrayBuffer(buffer)`
 * A plain array using `#fromArray(array)`
 *
 * Note:
 * See the documentation of [WebGLRenderingContext.bufferData](https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/bufferData)
 * for more info on buffer usage.
 */
declare class WebGLArrayBuffer {
    /**
     * @param {number} type Buffer type, either ARRAY_BUFFER or ELEMENT_ARRAY_BUFFER.
     * @param {number} [usage] Intended usage, either `STATIC_DRAW`, `STREAM_DRAW` or `DYNAMIC_DRAW`.
     * Default is `STATIC_DRAW`.
     */
    constructor(type: number, usage?: number);
    /**
     * @private
     * @type {Float32Array|Uint32Array|null}
     */
    private array_;
    /**
     * @private
     * @type {number}
     */
    private type_;
    /**
     * @private
     * @type {number}
     */
    private usage_;
    /**
     * Populates the buffer with an array of the given size (all values will be zeroes).
     * @param {number} size Array size
     * @return {WebGLArrayBuffer} This
     */
    ofSize(size: number): WebGLArrayBuffer;
    /**
     * Populates the buffer with an array of the given size.
     * @param {Array<number>} array Numerical array
     * @return {WebGLArrayBuffer} This
     */
    fromArray(array: Array<number>): WebGLArrayBuffer;
    /**
     * Populates the buffer with a raw binary array buffer.
     * @param {ArrayBuffer} buffer Raw binary buffer to populate the array with. Note that this buffer must have been
     * initialized for the same typed array class.
     * @return {WebGLArrayBuffer} This
     */
    fromArrayBuffer(buffer: ArrayBuffer): WebGLArrayBuffer;
    /**
     * @return {number} Buffer type.
     */
    getType(): number;
    /**
     * Will return null if the buffer was not initialized
     * @return {Float32Array|Uint32Array|null} Array.
     */
    getArray(): Float32Array | Uint32Array | null;
    /**
     * @param {Float32Array|Uint32Array} array Array.
     */
    setArray(array: Float32Array | Uint32Array): void;
    /**
     * @return {number} Usage.
     */
    getUsage(): number;
    /**
     * Will return 0 if the buffer is not initialized
     * @return {number} Array size
     */
    getSize(): number;
}

/**
 * Shader types, either `FRAGMENT_SHADER` or `VERTEX_SHADER`.
 */
type ShaderType = number;
declare namespace ShaderType {
    let FRAGMENT_SHADER: number;
    let VERTEX_SHADER: number;
}
/**
 * Description of an attribute in a buffer
 */
type AttributeDescription = {
    /**
     * Attribute name to use in shaders; if null, this attribute will not be enabled and is simply used as padding in the buffers
     */
    name: string | null;
    /**
     * Number of components per attributes
     */
    size: number;
    /**
     * Attribute type, i.e. number of bytes used to store the value. This is
     * determined by the class of typed array which the buffer uses (eg. `Float32Array` for a `FLOAT` attribute).
     * Default is `FLOAT`.
     */
    type?: number | undefined;
};
type UniformLiteralValue = number | Array<number> | HTMLCanvasElement | HTMLImageElement | ImageData | WebGLTexture | Transform;
/**
 * Uniform value can be a number, array of numbers (2 to 4), canvas element or a callback returning
 * one of the previous types.
 */
type UniformValue = UniformLiteralValue | ((arg0: FrameState) => UniformLiteralValue);
type PostProcessesOptions$1 = {
    /**
     * Scale ratio; if < 1, the post process will render to a texture smaller than
     * the main canvas which will then be sampled up (useful for saving resource on blur steps).
     */
    scaleRatio?: number | undefined;
    /**
     * Vertex shader source
     */
    vertexShader?: string | undefined;
    /**
     * Fragment shader source
     */
    fragmentShader?: string | undefined;
    /**
     * Uniform definitions for the post process step
     */
    uniforms?: {
        [x: string]: UniformValue;
    } | undefined;
};
type Options$o = {
    /**
     * Uniform definitions; property names must match the uniform
     * names in the provided or default shaders.
     */
    uniforms?: {
        [x: string]: UniformValue;
    } | undefined;
    /**
     * Post-processes definitions
     */
    postProcesses?: PostProcessesOptions$1[] | undefined;
    /**
     * The cache key for the canvas.
     */
    canvasCacheKey?: string | undefined;
};
/**
 * @classdesc
 * This class is intended to provide low-level functions related to WebGL rendering, so that accessing
 * directly the WebGL API should not be required anymore.
 *
 * Several operations are handled by the `WebGLHelper` class:
 *
 * ### Define custom shaders and uniforms
 *
 *   Shaders* are low-level programs executed on the GPU and written in GLSL. There are two types of shaders:
 *
 *   Vertex shaders are used to manipulate the position and attribute of *vertices* of rendered primitives (ie. corners of a square).
 *   Outputs are:
 *
 *   `gl_Position`: position of the vertex in screen space
 *
 *   Varyings usually prefixed with `v_` are passed on to the fragment shader
 *
 *   Fragment shaders are used to control the actual color of the pixels drawn on screen. Their only output is `gl_FragColor`.
 *
 *   Both shaders can take *uniforms* or *attributes* as input. Attributes are explained later. Uniforms are common, read-only values that
 *   can be changed at every frame and can be of type float, arrays of float or images.
 *
 *   Shaders must be compiled and assembled into a program like so:
 *   ```js
 *   // here we simply create two shaders and assemble them in a program which is then used
 *   // for subsequent rendering calls; note how a frameState is required to set up a program,
 *   // as several default uniforms are computed from it (projection matrix, zoom level, etc.)
 *   const vertexShader = new WebGLVertex(VERTEX_SHADER);
 *   const fragmentShader = new WebGLFragment(FRAGMENT_SHADER);
 *   const program = this.context.getProgram(fragmentShader, vertexShader);
 *   helper.useProgram(this.program, frameState);
 *   ```
 *
 *   Uniforms are defined using the `uniforms` option and can either be explicit values or callbacks taking the frame state as argument.
 *   You can also change their value along the way like so:
 *   ```js
 *   helper.setUniformFloatValue('u_value', valueAsNumber);
 *   ```
 *
 * ### Defining post processing passes
 *
 *   Post processing* describes the act of rendering primitives to a texture, and then rendering this texture to the final canvas
 *   while applying special effects in screen space.
 *   Typical uses are: blurring, color manipulation, depth of field, filtering...
 *
 *   The `WebGLHelper` class offers the possibility to define post processes at creation time using the `postProcesses` option.
 *   A post process step accepts the following options:
 *
 *   `fragmentShader` and `vertexShader`: text literals in GLSL language that will be compiled and used in the post processing step.
 *   `uniforms`: uniforms can be defined for the post processing steps just like for the main render.
 *   `scaleRatio`: allows using an intermediate texture smaller or higher than the final canvas in the post processing step.
 *     This is typically used in blur steps to reduce the performance overhead by using an already downsampled texture as input.
 *
 *   The {@link module:ol/webgl/PostProcessingPass~WebGLPostProcessingPass} class is used internally, refer to its documentation for more info.
 *
 * ### Binding WebGL buffers and flushing data into them
 *
 *   Data that must be passed to the GPU has to be transferred using {@link module:ol/webgl/Buffer~WebGLArrayBuffer} objects.
 *   A buffer has to be created only once, but must be bound every time the buffer content will be used for rendering.
 *   This is done using {@link bindBuffer}.
 *   When the buffer's array content has changed, the new data has to be flushed to the GPU memory; this is done using
 *   {@link flushBufferData}. Note: this operation is expensive and should be done as infrequently as possible.
 *
 *   When binding an array buffer, a `target` parameter must be given: it should be either {@link module:ol/webgl.ARRAY_BUFFER}
 *   (if the buffer contains vertices data) or {@link module:ol/webgl.ELEMENT_ARRAY_BUFFER} (if the buffer contains indices data).
 *
 *   Examples below:
 *   ```js
 *   // at initialization phase
 *   const verticesBuffer = new WebGLArrayBuffer([], DYNAMIC_DRAW);
 *   const indicesBuffer = new WebGLArrayBuffer([], DYNAMIC_DRAW);
 *
 *   // when array values have changed
 *   helper.flushBufferData(ARRAY_BUFFER, this.verticesBuffer);
 *   helper.flushBufferData(ELEMENT_ARRAY_BUFFER, this.indicesBuffer);
 *
 *   // at rendering phase
 *   helper.bindBuffer(ARRAY_BUFFER, this.verticesBuffer);
 *   helper.bindBuffer(ELEMENT_ARRAY_BUFFER, this.indicesBuffer);
 *   ```
 *
 * ### Specifying attributes
 *
 *   The GPU only receives the data as arrays of numbers. These numbers must be handled differently depending on what it describes (position, texture coordinate...).
 *   Attributes are used to specify these uses. Specify the attribute names with
 *   {@link module:ol/webgl/Helper~WebGLHelper#enableAttributes} (see code snippet below).
 *
 *   Please note that you will have to specify the type and offset of the attributes in the data array. You can refer to the documentation of [WebGLRenderingContext.vertexAttribPointer](https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/vertexAttribPointer) for more explanation.
 *   ```js
 *   // here we indicate that the data array has the following structure:
 *   // [posX, posY, offsetX, offsetY, texCoordU, texCoordV, posX, posY, ...]
 *   helper.enableAttributes([
 *     {
 *        name: 'a_position',
 *        size: 2
 *     },
 *     {
 *       name: 'a_offset',
 *       size: 2
 *     },
 *     {
 *       name: 'a_texCoord',
 *       size: 2
 *     }
 *   ])
 *   ```
 *
 * ### Rendering primitives
 *
 *   Once all the steps above have been achieved, rendering primitives to the screen is done using {@link prepareDraw}, {@link drawElements} and {@link finalizeDraw}.
 *   ```js
 *   // frame preparation step
 *   helper.prepareDraw(frameState);
 *
 *   // call this for every data array that has to be rendered on screen
 *   helper.drawElements(0, this.indicesBuffer.getArray().length);
 *
 *   // finalize the rendering by applying post processes
 *   helper.finalizeDraw(frameState);
 *   ```
 *
 * For an example usage of this class, refer to {@link module:ol/renderer/webgl/PointsLayer~WebGLPointsLayerRenderer}.
 */
declare class WebGLHelper extends Disposable {
    /**
     * @param {Options} [options] Options.
     */
    constructor(options?: Options$o);
    /** @private */
    private boundHandleWebGLContextLost_;
    /** @private */
    private boundHandleWebGLContextRestored_;
    /**
     * @private
     * @type {string}
     */
    private canvasCacheKey_;
    /**
     * @private
     * @type {WebGLRenderingContext}
     */
    private gl_;
    /**
     * @private
     * @type {!Object<string, BufferCacheEntry>}
     */
    private bufferCache_;
    /**
     * @private
     * @type {Object<string, Object>}
     */
    private extensionCache_;
    /**
     * @private
     * @type {WebGLProgram}
     */
    private currentProgram_;
    /**
     * @private
     * @type {boolean}
     */
    private needsToBeRecreated_;
    /**
     * @private
     * @type {import("../transform.js").Transform}
     */
    private offsetRotateMatrix_;
    /**
     * @private
     * @type {import("../transform.js").Transform}
     */
    private offsetScaleMatrix_;
    /**
     * @private
     * @type {Array<number>}
     */
    private tmpMat4_;
    /**
     * @private
     * @type {Object<string, Object<string, WebGLUniformLocation>>}
     */
    private uniformLocationsByProgram_;
    /**
     * @private
     * @type {Object<string, Object<string, number>>}
     */
    private attribLocationsByProgram_;
    /**
     * Holds info about custom uniforms used in the post processing pass.
     * If the uniform is a texture, the WebGL Texture object will be stored here.
     * @type {Array<UniformInternalDescription>}
     * @private
     */
    private uniforms_;
    /**
     * An array of PostProcessingPass objects is kept in this variable, built from the steps provided in the
     * options. If no post process was given, a default one is used (so as not to have to make an exception to
     * the frame buffer logic).
     * @type {Array<WebGLPostProcessingPass>}
     * @private
     */
    private postProcessPasses_;
    /**
     * @type {string|null}
     * @private
     */
    private shaderCompileErrors_;
    /**
     * @type {number}
     * @private
     */
    private startTime_;
    /**
     * @type {number}
     * @private
     */
    private maxAttributeCount_;
    /**
     * @param {Object<string, UniformValue>} uniforms Uniform definitions.
     */
    setUniforms(uniforms: {
        [x: string]: UniformValue;
    }): void;
    /**
     * @param {Object<string, UniformValue>} uniforms Uniform definitions.
     */
    addUniforms(uniforms: {
        [x: string]: UniformValue;
    }): void;
    /**
     * @param {string} canvasCacheKey The canvas cache key.
     * @return {boolean} The provided key matches the one this helper was constructed with.
     */
    canvasCacheKeyMatches(canvasCacheKey: string): boolean;
    /**
     * Get a WebGL extension.  If the extension is not supported, null is returned.
     * Extensions are cached after they are enabled for the first time.
     * @param {string} name The extension name.
     * @return {Object|null} The extension or null if not supported.
     */
    getExtension(name: string): any | null;
    /**
     * Will throw if the extension is not available
     * @return {ANGLE_instanced_arrays} Extension
     */
    getInstancedRenderingExtension_(): ANGLE_instanced_arrays;
    /**
     * Just bind the buffer if it's in the cache. Otherwise create
     * the WebGL buffer, bind it, populate it, and add an entry to
     * the cache.
     * @param {import("./Buffer").default} buffer Buffer.
     */
    bindBuffer(buffer: WebGLArrayBuffer): void;
    /**
     * Update the data contained in the buffer array; this is required for the
     * new data to be rendered
     * @param {import("./Buffer").default} buffer Buffer.
     */
    flushBufferData(buffer: WebGLArrayBuffer): void;
    /**
     * @param {import("./Buffer.js").default} buf Buffer.
     */
    deleteBuffer(buf: WebGLArrayBuffer): void;
    /**
     * Clear the buffer & set the viewport to draw.
     * Post process passes will be initialized here, the first one being bound as a render target for
     * subsequent draw calls.
     * @param {import("../Map.js").FrameState} frameState current frame state
     * @param {boolean} [disableAlphaBlend] If true, no alpha blending will happen.
     * @param {boolean} [enableDepth] If true, enables depth testing.
     */
    prepareDraw(frameState: FrameState, disableAlphaBlend?: boolean, enableDepth?: boolean): void;
    /**
     * @param {WebGLFramebuffer|null} frameBuffer The frame buffer.
     * @param {WebGLTexture} [texture] The texture.
     */
    bindFrameBuffer(frameBuffer: WebGLFramebuffer | null, texture?: WebGLTexture): void;
    /**
     * Bind the frame buffer from the initial render.
     */
    bindInitialFrameBuffer(): void;
    /**
     * Prepare a program to use a texture.
     * @param {WebGLTexture} texture The texture.
     * @param {number} slot The texture slot.
     * @param {string} uniformName The corresponding uniform name.
     */
    bindTexture(texture: WebGLTexture, slot: number, uniformName: string): void;
    /**
     * Set up an attribute array buffer for use in the vertex shader.
     * @param {import("./Buffer").default} buffer The buffer.
     * @param {string} attributeName The attribute name.
     * @param {number} size The number of components per attribute vertex.
     */
    bindAttribute(buffer: WebGLArrayBuffer, attributeName: string, size: number): void;
    /**
     * Clear the render target & bind it for future draw operations.
     * This is similar to `prepareDraw`, only post processes will not be applied.
     * Note: the whole viewport will be drawn to the render target, regardless of its size.
     * @param {import("../Map.js").FrameState} frameState current frame state
     * @param {import("./RenderTarget.js").default} renderTarget Render target to draw to
     * @param {boolean} [disableAlphaBlend] If true, no alpha blending will happen.
     * @param {boolean} [enableDepth] If true, enables depth testing.
     */
    prepareDrawToRenderTarget(frameState: FrameState, renderTarget: WebGLRenderTarget, disableAlphaBlend?: boolean, enableDepth?: boolean): void;
    /**
     * Execute a draw call based on the currently bound program, texture, buffers, attributes.
     * @param {number} start Start index.
     * @param {number} end End index.
     */
    drawElements(start: number, end: number): void;
    /**
     * Execute a draw call similar to `drawElements`, but using instanced rendering.
     * Will have no effect if `enableAttributesInstanced` was not called for this rendering pass.
     * @param {number} start Start index.
     * @param {number} end End index.
     * @param {number} instanceCount The number of instances to render
     */
    drawElementsInstanced(start: number, end: number, instanceCount: number): void;
    /**
     * Apply the successive post process passes which will eventually render to the actual canvas.
     * @param {import("../Map.js").FrameState} frameState current frame state
     * @param {function(WebGLRenderingContext, import("../Map.js").FrameState):void} [preCompose] Called before composing.
     * @param {function(WebGLRenderingContext, import("../Map.js").FrameState):void} [postCompose] Called before composing.
     */
    finalizeDraw(frameState: FrameState, preCompose?: (arg0: WebGLRenderingContext, arg1: FrameState) => void, postCompose?: (arg0: WebGLRenderingContext, arg1: FrameState) => void): void;
    /**
     * @return {HTMLCanvasElement} Canvas.
     */
    getCanvas(): HTMLCanvasElement;
    /**
     * Get the WebGL rendering context
     * @return {WebGLRenderingContext} The rendering context.
     */
    getGL(): WebGLRenderingContext;
    /**
     * Sets the default matrix uniforms for a given frame state. This is called internally in `prepareDraw`.
     * @param {import("../Map.js").FrameState} frameState Frame state.
     */
    applyFrameState(frameState: FrameState): void;
    /**
     * Sets the `u_hitDetection` uniform.
     * @param {boolean} enabled Whether to enable the hit detection code path
     */
    applyHitDetectionUniform(enabled: boolean): void;
    /**
     * Sets the custom uniforms based on what was given in the constructor. This is called internally in `prepareDraw`.
     * @param {import("../Map.js").FrameState} frameState Frame state.
     */
    applyUniforms(frameState: FrameState): void;
    /**
     * Set up a program for use. The program will be set as the current one. Then, the uniforms used
     * in the program will be set based on the current frame state and the helper configuration.
     * @param {WebGLProgram} program Program.
     * @param {import("../Map.js").FrameState} [frameState] Frame state.
     */
    useProgram(program: WebGLProgram, frameState?: FrameState): void;
    /**
     * Will attempt to compile a vertex or fragment shader based on source
     * On error, the shader will be returned but
     * `gl.getShaderParameter(shader, gl.COMPILE_STATUS)` will return `true`
     * Use `gl.getShaderInfoLog(shader)` to have details
     * @param {string} source Shader source
     * @param {ShaderType} type VERTEX_SHADER or FRAGMENT_SHADER
     * @return {WebGLShader} Shader object
     */
    compileShader(source: string, type: ShaderType): WebGLShader;
    /**
     * Create a program for a vertex and fragment shader.  Throws if shader compilation fails.
     * @param {string} fragmentShaderSource Fragment shader source.
     * @param {string} vertexShaderSource Vertex shader source.
     * @return {WebGLProgram} Program
     */
    getProgram(fragmentShaderSource: string, vertexShaderSource: string): WebGLProgram;
    /**
     * Will get the location from the shader or the cache
     * @param {string} name Uniform name
     * @return {WebGLUniformLocation} uniformLocation
     */
    getUniformLocation(name: string): WebGLUniformLocation;
    /**
     * Will get the location from the shader or the cache
     * @param {string} name Attribute name
     * @return {number} attribLocation
     */
    getAttributeLocation(name: string): number;
    /**
     * Sets the given transform to apply the rotation/translation/scaling of the given frame state.
     * The resulting transform can be used to convert world space coordinates to view coordinates in the [-1, 1] range.
     * @param {import("../Map.js").FrameState} frameState Frame state.
     * @param {import("../transform").Transform} transform Transform to update.
     * @return {import("../transform").Transform} The updated transform object.
     */
    makeProjectionTransform(frameState: FrameState, transform: Transform): Transform;
    /**
     * Give a value for a standard float uniform
     * @param {string} uniform Uniform name
     * @param {number} value Value
     */
    setUniformFloatValue(uniform: string, value: number): void;
    /**
     * Give a value for a vec2 uniform
     * @param {string} uniform Uniform name
     * @param {Array<number>} value Array of length 4.
     */
    setUniformFloatVec2(uniform: string, value: Array<number>): void;
    /**
     * Give a value for a vec4 uniform
     * @param {string} uniform Uniform name
     * @param {Array<number>} value Array of length 4.
     */
    setUniformFloatVec4(uniform: string, value: Array<number>): void;
    /**
     * Give a value for a standard matrix4 uniform
     * @param {string} uniform Uniform name
     * @param {Array<number>} value Matrix value
     */
    setUniformMatrixValue(uniform: string, value: Array<number>): void;
    /**
     * Disable all vertex attributes.
     * @private
     */
    private disableAllAttributes_;
    /**
     * Will set the currently bound buffer to an attribute of the shader program. Used by `#enableAttributes`
     * internally.
     * @param {string} attribName Attribute name
     * @param {number} size Number of components per attributes
     * @param {number} type UNSIGNED_INT, UNSIGNED_BYTE, UNSIGNED_SHORT or FLOAT
     * @param {number} stride Stride in bytes (0 means attribs are packed)
     * @param {number} offset Offset in bytes
     * @param {boolean} instanced Whether the attribute is used for instanced rendering
     * @private
     */
    private enableAttributeArray_;
    /**
     * @private
     * @param {Array<AttributeDescription>} attributes Ordered list of attributes to read from the buffer
     * @param {boolean} instanced Whether the attributes are instanced.
     */
    private enableAttributes_;
    /**
     * Will enable the following attributes to be read from the currently bound buffer,
     * i.e. tell the GPU where to read the different attributes in the buffer. An error in the
     * size/type/order of attributes will most likely break the rendering and throw a WebGL exception.
     * @param {Array<AttributeDescription>} attributes Ordered list of attributes to read from the buffer
     */
    enableAttributes(attributes: Array<AttributeDescription>): void;
    /**
     * Will enable these attributes as instanced, meaning that they will only be read
     * once per instance instead of per vertex.
     * @param {Array<AttributeDescription>} attributes Ordered list of attributes to read from the buffer
     */
    enableAttributesInstanced(attributes: Array<AttributeDescription>): void;
    /**
     * WebGL context was lost
     * @param {WebGLContextEvent} event The context loss event.
     * @private
     */
    private handleWebGLContextLost;
    /**
     * WebGL context was restored
     * @private
     */
    private handleWebGLContextRestored;
    /**
     * Returns whether this helper needs to be recreated, as the context was lost and then restored.
     * @return {boolean} Whether this helper needs to be recreated.
     */
    needsToBeRecreated(): boolean;
    /**
     * Will create or reuse a given webgl texture and apply the given size. If no image data
     * specified, the texture will be empty, otherwise image data will be used and the `size`
     * parameter will be ignored.  If a Uint8Array is provided for data, a size must also be provided.
     * Note: wrap parameters are set to clamp to edge, min filter is set to linear.
     * @param {Array<number>} size Expected size of the texture
     * @param {ImageData|HTMLImageElement|HTMLCanvasElement|Uint8Array|null} data Image data/object to bind to the texture
     * @param {WebGLTexture} [texture] Existing texture to reuse
     * @param {boolean} [nearest] Use gl.NEAREST for min/mag filter.
     * @return {WebGLTexture} The generated texture
     */
    createTexture(size: Array<number>, data: ImageData | HTMLImageElement | HTMLCanvasElement | Uint8Array | null, texture?: WebGLTexture, nearest?: boolean): WebGLTexture;
}

type PostProcessesOptions = {
    /**
     * Scale ratio; if < 1, the post process will render to a texture smaller than
     * the main canvas that will then be sampled up (useful for saving resource on blur steps).
     */
    scaleRatio?: number | undefined;
    /**
     * Vertex shader source
     */
    vertexShader?: string | undefined;
    /**
     * Fragment shader source
     */
    fragmentShader?: string | undefined;
    /**
     * Uniform definitions for the post process step
     */
    uniforms?: {
        [x: string]: UniformValue;
    } | undefined;
};
type Options$n = {
    /**
     * Uniform definitions for the post process steps
     */
    uniforms?: {
        [x: string]: UniformValue;
    } | undefined;
    /**
     * Post-processes definitions
     */
    postProcesses?: PostProcessesOptions[] | undefined;
};
/**
 * @typedef {Object} PostProcessesOptions
 * @property {number} [scaleRatio] Scale ratio; if < 1, the post process will render to a texture smaller than
 * the main canvas that will then be sampled up (useful for saving resource on blur steps).
 * @property {string} [vertexShader] Vertex shader source
 * @property {string} [fragmentShader] Fragment shader source
 * @property {Object<string,import("../../webgl/Helper").UniformValue>} [uniforms] Uniform definitions for the post process step
 */
/**
 * @typedef {Object} Options
 * @property {Object<string,import("../../webgl/Helper").UniformValue>} [uniforms] Uniform definitions for the post process steps
 * @property {Array<PostProcessesOptions>} [postProcesses] Post-processes definitions
 */
/**
 * @classdesc
 * Base WebGL renderer class.
 * Holds all logic related to data manipulation & some common rendering logic
 * @template {import("../../layer/Layer.js").default} LayerType
 * @extends {LayerRenderer<LayerType>}
 */
declare class WebGLLayerRenderer<LayerType extends Layer> extends LayerRenderer<LayerType> {
    /**
     * @param {LayerType} layer Layer.
     * @param {Options} [options] Options.
     */
    constructor(layer: LayerType, options?: Options$n);
    /**
     * The transform for viewport CSS pixels to rendered pixels.  This transform is only
     * set before dispatching rendering events.
     * @private
     * @type {import("../../transform.js").Transform}
     */
    private inversePixelTransform_;
    /**
     * @private
     */
    private postProcesses_;
    /**
     * @private
     */
    private uniforms_;
    /**
     * @type {WebGLHelper}
     * @protected
     */
    protected helper: WebGLHelper;
    onMapChanged_: () => void;
    /**
     * @param {WebGLRenderingContext} context The WebGL rendering context.
     * @param {import("../../Map.js").FrameState} frameState Frame state.
     * @protected
     */
    protected dispatchPreComposeEvent(context: WebGLRenderingContext, frameState: FrameState): void;
    /**
     * @param {WebGLRenderingContext} context The WebGL rendering context.
     * @param {import("../../Map.js").FrameState} frameState Frame state.
     * @protected
     */
    protected dispatchPostComposeEvent(context: WebGLRenderingContext, frameState: FrameState): void;
    /**
     * Reset options (only handles uniforms).
     * @param {Options} options Options.
     */
    reset(options: Options$n): void;
    /**
     * @protected
     */
    protected removeHelper(): void;
    /**
     * @protected
     */
    protected afterHelperCreated(): void;
    /**
     * Determine whether renderFrame should be called.
     * @param {import("../../Map.js").FrameState} frameState Frame state.
     * @return {boolean} Layer is ready to be rendered.
     * @protected
     */
    protected prepareFrameInternal(frameState: FrameState): boolean;
    /**
     * @protected
     */
    protected clearCache(): void;
    /**
     * @param {import("../../render/EventType.js").default} type Event type.
     * @param {WebGLRenderingContext} context The rendering context.
     * @param {import("../../Map.js").FrameState} frameState Frame state.
     * @private
     */
    private dispatchRenderEvent_;
    /**
     * @param {WebGLRenderingContext} context The rendering context.
     * @param {import("../../Map.js").FrameState} frameState Frame state.
     * @protected
     */
    protected preRender(context: WebGLRenderingContext, frameState: FrameState): void;
    /**
     * @param {WebGLRenderingContext} context The rendering context.
     * @param {import("../../Map.js").FrameState} frameState Frame state.
     * @protected
     */
    protected postRender(context: WebGLRenderingContext, frameState: FrameState): void;
}

type Point = Point$1;
type PointFeature = Feature$1<Point>;
/**
 * A description of a custom attribute to be passed on to the GPU, with a value different
 * for each feature.
 */
type CustomAttribute = {
    /**
     * Attribute name.
     */
    name: string;
    /**
     * This callback computes the numerical value of the
     * attribute for a given feature (properties are available as 2nd arg for quicker access).
     */
    callback: (arg0: PointFeature, arg1: {
        [x: string]: any;
    }) => number;
};
type Options$m = {
    /**
     * A CSS class name to set to the canvas element.
     */
    className?: string | undefined;
    /**
     * These attributes will be read from the features in the source and then
     * passed to the GPU. The `name` property of each attribute will serve as its identifier:
     * In the vertex shader as an `attribute` by prefixing it with `a_`
     * In the fragment shader as a `varying` by prefixing it with `v_`
     * Please note that these can only be numerical values.
     */
    attributes?: CustomAttribute[] | undefined;
    /**
     * Vertex shader source, mandatory.
     */
    vertexShader: string;
    /**
     * Fragment shader source, mandatory.
     */
    fragmentShader: string;
    /**
     * Whether shader is hit detection aware.
     */
    hitDetectionEnabled?: boolean | undefined;
    /**
     * Uniform definitions for the post process steps
     * Please note that `u_texture` is reserved for the main texture slot and `u_opacity` is reserved for the layer opacity.
     */
    uniforms?: {
        [x: string]: UniformValue;
    } | undefined;
    /**
     * Post-processes definitions
     */
    postProcesses?: PostProcessesOptions[] | undefined;
};
/** @typedef {import("../../geom/Point.js").default} Point */
/** @typedef {import("../../Feature").default<Point>} PointFeature */
/**
 * @typedef {Object} CustomAttribute A description of a custom attribute to be passed on to the GPU, with a value different
 * for each feature.
 * @property {string} name Attribute name.
 * @property {function(PointFeature, Object<string, *>):number} callback This callback computes the numerical value of the
 * attribute for a given feature (properties are available as 2nd arg for quicker access).
 */
/**
 * @typedef {Object} FeatureCacheItem Object that holds a reference to a feature, its geometry and properties. Used to optimize
 * rebuildBuffers by accessing these objects quicker.
 * @property {PointFeature} feature Feature
 * @property {Object<string, *>} properties Feature properties
 * @property {import("../../coordinate.js").Coordinate} flatCoordinates Point coordinates
 */
/**
 * @typedef {Object} Options
 * @property {string} [className='ol-layer'] A CSS class name to set to the canvas element.
 * @property {Array<CustomAttribute>} [attributes] These attributes will be read from the features in the source and then
 * passed to the GPU. The `name` property of each attribute will serve as its identifier:
 *  In the vertex shader as an `attribute` by prefixing it with `a_`
 *  In the fragment shader as a `varying` by prefixing it with `v_`
 * Please note that these can only be numerical values.
 * @property {string} vertexShader Vertex shader source, mandatory.
 * @property {string} fragmentShader Fragment shader source, mandatory.
 * @property {boolean} [hitDetectionEnabled] Whether shader is hit detection aware.
 * @property {Object<string,import("../../webgl/Helper").UniformValue>} [uniforms] Uniform definitions for the post process steps
 * Please note that `u_texture` is reserved for the main texture slot and `u_opacity` is reserved for the layer opacity.
 * @property {Array<import("./Layer").PostProcessesOptions>} [postProcesses] Post-processes definitions
 */
/**
 * @classdesc
 * WebGL vector renderer optimized for points.
 * All features will be rendered as quads (two triangles forming a square). New data will be flushed to the GPU
 * every time the vector source changes.
 *
 * You need to provide vertex and fragment shaders for rendering. This can be done using
 * {@link module:ol/webgl/ShaderBuilder~ShaderBuilder} utilities. These shaders shall expect a `a_position` attribute
 * containing the screen-space projected center of the quad, as well as a `a_index` attribute
 * whose value (0, 1, 2 or 3) indicates which quad vertex is currently getting processed (see structure below).
 *
 * To include variable attributes in the shaders, you need to declare them using the `attributes` property of
 * the options object like so:
 * ```js
 * new WebGLPointsLayerRenderer(layer, {
 *   attributes: [
 *     {
 *       name: 'size',
 *       callback: function(feature) {
 *         // compute something with the feature
 *       }
 *     },
 *     {
 *       name: 'weight',
 *       callback: function(feature) {
 *         // compute something with the feature
 *       }
 *     },
 *   ],
 *   vertexShader:
 *     // shader using attribute a_weight and a_size
 *   fragmentShader:
 *     // shader using varying v_weight and v_size
 * ```
 *
 * To enable hit detection, you must as well provide dedicated shaders using the `hitVertexShader`
 * and `hitFragmentShader` properties. These shall expect the `a_hitColor` attribute to contain
 * the final color that will have to be output for hit detection to work.
 *
 * The following uniform is used for the main texture: `u_texture`.
 * The following uniform is used for the layer opacity: `u_opacity`.
 *
 * Please note that the main shader output should have premultiplied alpha, otherwise visual anomalies may occur.
 *
 * Points are rendered as quads with the following structure:
 *
 * ```
 *   (u0, v1)      (u1, v1)
 *  [3]----------[2]
 *   |`           |
 *   |  `         |
 *   |    `       |
 *   |      `     |
 *   |        `   |
 *   |          ` |
 *  [0]----------[1]
 *   (u0, v0)      (u1, v0)
 *  ```
 *
 * This uses {@link module:ol/webgl/Helper~WebGLHelper} internally.
 *
 * @api
 */
declare class WebGLPointsLayerRenderer extends WebGLLayerRenderer<any> {
    /**
     * @param {import("../../layer/Layer.js").default} layer Layer.
     * @param {Options} options Options.
     */
    constructor(layer: Layer, options: Options$m);
    /**
     * @private
     */
    private sourceRevision_;
    /**
     * @private
     */
    private verticesBuffer_;
    /**
     * @private
     */
    private instanceAttributesBuffer_;
    /**
     * @private
     */
    private indicesBuffer_;
    /**
     * @private
     */
    private vertexShader_;
    /**
     * @private
     */
    private fragmentShader_;
    /**
     * @type {WebGLProgram}
     * @private
     */
    private program_;
    /**
     * @type {boolean}
     * @private
     */
    private hitDetectionEnabled_;
    /**
     * A list of attributes used by the renderer.
     * @type {Array<import('../../webgl/Helper.js').AttributeDescription>}
     */
    attributes: Array<AttributeDescription>;
    /**
     * @type {Array<import('../../webgl/Helper.js').AttributeDescription>}
     */
    instanceAttributes: Array<AttributeDescription>;
    customAttributes: CustomAttribute[];
    /**
     * @private
     */
    private previousExtent_;
    /**
     * This transform is updated on every frame and is the composition of:
     * - invert of the world->screen transform that was used when rebuilding buffers (see `this.renderTransform_`)
     * - current world->screen transform
     * @type {import("../../transform.js").Transform}
     * @private
     */
    private currentTransform_;
    /**
     * This transform is updated when buffers are rebuilt and converts world space coordinates to screen space
     * @type {import("../../transform.js").Transform}
     * @private
     */
    private renderTransform_;
    /**
     * @type {import("../../transform.js").Transform}
     * @private
     */
    private invertRenderTransform_;
    /**
     * @type {Float32Array}
     * @private
     */
    private renderInstructions_;
    /**
     * @type {WebGLRenderTarget}
     * @private
     */
    private hitRenderTarget_;
    /**
     * Keep track of latest message sent to worker
     * @type {number}
     * @private
     */
    private lastSentId;
    /**
     * @private
     */
    private worker_;
    /**
     * This object will be updated when the source changes. Key is uid.
     * @type {Object<string, FeatureCacheItem>}
     * @private
     */
    private featureCache_;
    /**
     * Amount of features in the cache.
     * @type {number}
     * @private
     */
    private featureCount_;
    /**
     * @private
     */
    private sourceListenKeys_;
    /**
     * @param {import("../../source/Vector.js").VectorSourceEvent} event Event.
     * @private
     */
    private handleSourceFeatureAdded_;
    /**
     * @param {import("../../source/Vector.js").VectorSourceEvent} event Event.
     * @private
     */
    private handleSourceFeatureChanged_;
    /**
     * @param {import("../../source/Vector.js").VectorSourceEvent} event Event.
     * @private
     */
    private handleSourceFeatureDelete_;
    /**
     * @private
     */
    private handleSourceFeatureClear_;
    /**
     * Render the layer.
     * @param {import("../../Map.js").FrameState} frameState Frame state.
     * @return {HTMLElement} The rendered element.
     * @override
     */
    override renderFrame(frameState: FrameState): HTMLElement;
    /**
     * Rebuild internal webgl buffers based on current view extent; costly, should not be called too much
     * @param {import("../../Map").FrameState} frameState Frame state.
     * @private
     */
    private rebuildBuffers_;
    /**
     * Render the world, either to the main framebuffer or to the hit framebuffer
     * @param {import("../../Map.js").FrameState} frameState current frame state
     * @param {boolean} forHitDetection whether the rendering is for hit detection
     * @param {number} startWorld the world to render in the first iteration
     * @param {number} endWorld the last world to render
     * @param {number} worldWidth the width of the worlds being rendered
     */
    renderWorlds(frameState: FrameState, forHitDetection: boolean, startWorld: number, endWorld: number, worldWidth: number): void;
    renderDeclutter(): void;
}

/**
 * @typedef {Object} AttributeDescription
 * @property {string} name Attribute name, as will be declared in the header of the vertex shader (including a_)
 * @property {string} type Attribute GLSL type, either `float`, `vec2`, `vec4`...
 * @property {string} varyingName Varying name, as will be declared in the header of both shaders (including v_)
 * @property {string} varyingType Varying type, either `float`, `vec2`, `vec4`...
 * @property {string} varyingExpression GLSL expression to assign to the varying in the vertex shader (e.g. `unpackColor(a_myAttr)`)
 */
/**
 * @typedef {Object} UniformDescription
 * @property {string} name Uniform name, as will be declared in the header of the vertex shader (including u_)
 * @property {string} type Uniform GLSL type, either `float`, `vec2`, `vec4`...
 */
/**
 * @classdesc
 * This class implements a classic builder pattern for generating many different types of shaders.
 * Methods can be chained, e. g.:
 *
 * ```js
 * const shader = new ShaderBuilder()
 *   .addAttribute('a_width', 'float')
 *   .addUniform('u_time', 'float)
 *   .setColorExpression('...')
 *   .setSymbolSizeExpression('...')
 *   .getSymbolFragmentShader();
 * ```
 *
 * A note on [alpha premultiplication](https://en.wikipedia.org/wiki/Alpha_compositing#Straight_versus_premultiplied):
 * The ShaderBuilder class expects all colors to **not having been alpha-premultiplied!** This is because alpha
 * premultiplication is done at the end of each fragment shader.
 */
declare class ShaderBuilder {
    /**
     * Uniforms; these will be declared in the header (should include the type).
     * @type {Array<UniformDescription>}
     * @private
     */
    private uniforms_;
    /**
     * Attributes; these will be declared in the header (should include the type).
     * @type {Array<AttributeDescription>}
     * @private
     */
    private attributes_;
    /**
     * @type {boolean}
     * @private
     */
    private hasSymbol_;
    /**
     * @type {string}
     * @private
     */
    private symbolSizeExpression_;
    /**
     * @type {string}
     * @private
     */
    private symbolRotationExpression_;
    /**
     * @type {string}
     * @private
     */
    private symbolOffsetExpression_;
    /**
     * @type {string}
     * @private
     */
    private symbolColorExpression_;
    /**
     * @type {string}
     * @private
     */
    private texCoordExpression_;
    /**
     * @type {string}
     * @private
     */
    private discardExpression_;
    /**
     * @type {boolean}
     * @private
     */
    private symbolRotateWithView_;
    /**
     * @type {boolean}
     * @private
     */
    private hasStroke_;
    /**
     * @type {string}
     * @private
     */
    private strokeWidthExpression_;
    /**
     * @type {string}
     * @private
     */
    private strokeColorExpression_;
    /**
     * @private
     */
    private strokeOffsetExpression_;
    /**
     * @private
     */
    private strokeCapExpression_;
    /**
     * @private
     */
    private strokeJoinExpression_;
    /**
     * @private
     */
    private strokeMiterLimitExpression_;
    /**
     * @private
     */
    private strokeDistanceFieldExpression_;
    /**
     * @private
     * @type {string}
     */
    private strokePatternLengthExpression_;
    /**
     * @type {boolean}
     * @private
     */
    private hasFill_;
    /**
     * @type {string}
     * @private
     */
    private fillColorExpression_;
    /**
     * @type {Array<string>}
     * @private
     */
    private vertexShaderFunctions_;
    /**
     * @type {Array<string>}
     * @private
     */
    private fragmentShaderFunctions_;
    /**
     * Adds a uniform accessible in both fragment and vertex shaders.
     * The given name should include a type, such as `sampler2D u_texture`.
     * @param {string} name Uniform name, including the `u_` prefix
     * @param {'float'|'vec2'|'vec3'|'vec4'|'sampler2D'} type GLSL type
     * @return {ShaderBuilder} the builder object
     */
    addUniform(name: string, type: "float" | "vec2" | "vec3" | "vec4" | "sampler2D"): ShaderBuilder;
    /**
     * Adds an attribute accessible in the vertex shader, read from the geometry buffer.
     * The given name should include a type, such as `vec2 a_position`.
     * Attributes will also be made available under the same name in fragment shaders.
     * @param {string} name Attribute name, including the `a_` prefix
     * @param {'float'|'vec2'|'vec3'|'vec4'} type GLSL type
     * @param {string} [varyingExpression] Expression which will be assigned to the varying in the vertex shader, and
     * passed on to the fragment shader.
     * @param {'float'|'vec2'|'vec3'|'vec4'} [varyingType] Type of the attribute after transformation;
     * e.g. `vec4` after unpacking color components
     * @return {ShaderBuilder} the builder object
     */
    addAttribute(name: string, type: "float" | "vec2" | "vec3" | "vec4", varyingExpression?: string, varyingType?: "float" | "vec2" | "vec3" | "vec4"): ShaderBuilder;
    /**
     * Sets an expression to compute the size of the shape.
     * This expression can use all the uniforms and attributes available
     * in the vertex shader, and should evaluate to a `vec2` value.
     * @param {string} expression Size expression
     * @return {ShaderBuilder} the builder object
     */
    setSymbolSizeExpression(expression: string): ShaderBuilder;
    /**
     * @return {string} The current symbol size expression
     */
    getSymbolSizeExpression(): string;
    /**
     * Sets an expression to compute the rotation of the shape.
     * This expression can use all the uniforms and attributes available
     * in the vertex shader, and should evaluate to a `float` value in radians.
     * @param {string} expression Size expression
     * @return {ShaderBuilder} the builder object
     */
    setSymbolRotationExpression(expression: string): ShaderBuilder;
    /**
     * Sets an expression to compute the offset of the symbol from the point center.
     * This expression can use all the uniforms and attributes available
     * in the vertex shader, and should evaluate to a `vec2` value.
     * @param {string} expression Offset expression
     * @return {ShaderBuilder} the builder object
     */
    setSymbolOffsetExpression(expression: string): ShaderBuilder;
    /**
     * @return {string} The current symbol offset expression
     */
    getSymbolOffsetExpression(): string;
    /**
     * Sets an expression to compute the color of the shape.
     * This expression can use all the uniforms, varyings and attributes available
     * in the fragment shader, and should evaluate to a `vec4` value.
     * @param {string} expression Color expression
     * @return {ShaderBuilder} the builder object
     */
    setSymbolColorExpression(expression: string): ShaderBuilder;
    /**
     * @return {string} The current symbol color expression
     */
    getSymbolColorExpression(): string;
    /**
     * Sets an expression to compute the texture coordinates of the vertices.
     * This expression can use all the uniforms and attributes available
     * in the vertex shader, and should evaluate to a `vec4` value.
     * @param {string} expression Texture coordinate expression
     * @return {ShaderBuilder} the builder object
     */
    setTextureCoordinateExpression(expression: string): ShaderBuilder;
    /**
     * Sets an expression to determine whether a fragment (pixel) should be discarded,
     * i.e. not drawn at all.
     * This expression can use all the uniforms, varyings and attributes available
     * in the fragment shader, and should evaluate to a `bool` value (it will be
     * used in an `if` statement)
     * @param {string} expression Fragment discard expression
     * @return {ShaderBuilder} the builder object
     */
    setFragmentDiscardExpression(expression: string): ShaderBuilder;
    /**
     * @return {string} The current fragment discard expression
     */
    getFragmentDiscardExpression(): string;
    /**
     * Sets whether the symbols should rotate with the view or stay aligned with the map.
     * Note: will only be used for point geometry shaders.
     * @param {boolean} rotateWithView Rotate with view
     * @return {ShaderBuilder} the builder object
     */
    setSymbolRotateWithView(rotateWithView: boolean): ShaderBuilder;
    /**
     * @param {string} expression Stroke width expression, returning value in pixels
     * @return {ShaderBuilder} the builder object
     */
    setStrokeWidthExpression(expression: string): ShaderBuilder;
    /**
     * @param {string} expression Stroke color expression, evaluate to `vec4`: can rely on currentLengthPx and currentRadiusPx
     * @return {ShaderBuilder} the builder object
     */
    setStrokeColorExpression(expression: string): ShaderBuilder;
    /**
     * @return {string} The current stroke color expression
     */
    getStrokeColorExpression(): string;
    /**
     * @param {string} expression Stroke color expression, evaluate to `float`
     * @return {ShaderBuilder} the builder object
     */
    setStrokeOffsetExpression(expression: string): ShaderBuilder;
    /**
     * @param {string} expression Stroke line cap expression, evaluate to `float`
     * @return {ShaderBuilder} the builder object
     */
    setStrokeCapExpression(expression: string): ShaderBuilder;
    /**
     * @param {string} expression Stroke line join expression, evaluate to `float`
     * @return {ShaderBuilder} the builder object
     */
    setStrokeJoinExpression(expression: string): ShaderBuilder;
    /**
     * @param {string} expression Stroke miter limit expression, evaluate to `float`
     * @return {ShaderBuilder} the builder object
     */
    setStrokeMiterLimitExpression(expression: string): ShaderBuilder;
    /**
     * @param {string} expression Stroke distance field expression, evaluate to `float`
     * This can override the default distance field; can rely on currentLengthPx and currentRadiusPx
     * @return {ShaderBuilder} the builder object
     */
    setStrokeDistanceFieldExpression(expression: string): ShaderBuilder;
    /**
     * Defining a pattern length for a stroke lets us avoid having visual artifacts when
     * a linestring is very long and thus has very high "distance" attributes on its vertices.
     * If we apply a pattern or dash array to a stroke we know for certain that the full distance value
     * is not necessary and can be trimmed down using `mod(currentDistance, patternLength)`.
     * @param {string} expression Stroke expression that evaluates to a`float; value is expected to be
     * in pixels.
     * @return {ShaderBuilder} the builder object
     */
    setStrokePatternLengthExpression(expression: string): ShaderBuilder;
    /**
     * @return {string} The current stroke pattern length expression.
     */
    getStrokePatternLengthExpression(): string;
    /**
     * @param {string} expression Fill color expression, evaluate to `vec4`
     * @return {ShaderBuilder} the builder object
     */
    setFillColorExpression(expression: string): ShaderBuilder;
    /**
     * @return {string} The current fill color expression
     */
    getFillColorExpression(): string;
    addVertexShaderFunction(code: any): this;
    addFragmentShaderFunction(code: any): this;
    /**
     * Generates a symbol vertex shader from the builder parameters
     * @return {string|null} The full shader as a string; null if no size or color specified
     */
    getSymbolVertexShader(): string | null;
    /**
     * Generates a symbol fragment shader from the builder parameters
     * @return {string|null} The full shader as a string; null if no size or color specified
     */
    getSymbolFragmentShader(): string | null;
    /**
     * Generates a stroke vertex shader from the builder parameters
     * @return {string|null} The full shader as a string; null if no size or color specified
     */
    getStrokeVertexShader(): string | null;
    /**
     * Generates a stroke fragment shader from the builder parameters
     *
     * @return {string|null} The full shader as a string; null if no size or color specified
     */
    getStrokeFragmentShader(): string | null;
    /**
     * Generates a fill vertex shader from the builder parameters
     *
     * @return {string|null} The full shader as a string; null if no color specified
     */
    getFillVertexShader(): string | null;
    /**
     * Generates a fill fragment shader from the builder parameters
     * @return {string|null} The full shader as a string; null if no color specified
     */
    getFillFragmentShader(): string | null;
}

type StyleParseResult = {
    /**
     * Shader builder pre-configured according to a given style
     */
    builder: ShaderBuilder;
    /**
     * Uniform definitions
     */
    uniforms: UniformDefinitions;
    /**
     * Attribute definitions
     */
    attributes: AttributeDefinitions;
};

type Feature = Feature$1;
/**
 * Object that holds a reference to a feature as well as the raw coordinates of its various geometries
 */
type GeometryBatchItem = {
    /**
     * Feature
     */
    feature: Feature | RenderFeature;
    /**
     * Array of flat coordinates arrays, one for each geometry related to the feature
     */
    flatCoordss: Array<Array<number>>;
    /**
     * Only defined for linestring and polygon batches
     */
    verticesCount?: number | undefined;
    /**
     * Only defined for polygon batches
     */
    ringsCount?: number | undefined;
    /**
     * Array of vertices counts in each ring for each geometry; only defined for polygons batches
     */
    ringsVerticesCounts?: number[][] | undefined;
    /**
     * The reference in the global batch (used for hit detection)
     */
    ref?: number | undefined;
};
/**
 * A geometry batch specific to polygons
 */
type PolygonGeometryBatch = {
    /**
     * Dictionary of all entries in the batch with associated computed values.
     * One entry corresponds to one feature. Key is feature uid.
     */
    entries: {
        [x: string]: GeometryBatchItem;
    };
    /**
     * Amount of geometries in the batch.
     */
    geometriesCount: number;
    /**
     * Amount of vertices from geometries in the batch.
     */
    verticesCount: number;
    /**
     * How many outer and inner rings in this batch.
     */
    ringsCount: number;
};
/**
 * A geometry batch specific to lines
 */
type LineStringGeometryBatch = {
    /**
     * Dictionary of all entries in the batch with associated computed values.
     * One entry corresponds to one feature. Key is feature uid.
     */
    entries: {
        [x: string]: GeometryBatchItem;
    };
    /**
     * Amount of geometries in the batch.
     */
    geometriesCount: number;
    /**
     * Amount of vertices from geometries in the batch.
     */
    verticesCount: number;
};
/**
 * A geometry batch specific to points
 */
type PointGeometryBatch = {
    /**
     * Dictionary of all entries in the batch with associated computed values.
     * One entry corresponds to one feature. Key is feature uid.
     */
    entries: {
        [x: string]: GeometryBatchItem;
    };
    /**
     * Amount of geometries in the batch.
     */
    geometriesCount: number;
};
/**
 * @typedef {import("../../Feature.js").default} Feature
 */
/**
 * @typedef {import("../../geom/Geometry.js").Type} GeometryType
 */
/**
 * @typedef {Object} GeometryBatchItem Object that holds a reference to a feature as well as the raw coordinates of its various geometries
 * @property {Feature|RenderFeature} feature Feature
 * @property {Array<Array<number>>} flatCoordss Array of flat coordinates arrays, one for each geometry related to the feature
 * @property {number} [verticesCount] Only defined for linestring and polygon batches
 * @property {number} [ringsCount] Only defined for polygon batches
 * @property {Array<Array<number>>} [ringsVerticesCounts] Array of vertices counts in each ring for each geometry; only defined for polygons batches
 * @property {number} [ref] The reference in the global batch (used for hit detection)
 */
/**
 * @typedef {PointGeometryBatch|LineStringGeometryBatch|PolygonGeometryBatch} GeometryBatch
 */
/**
 * @typedef {Object} PolygonGeometryBatch A geometry batch specific to polygons
 * @property {Object<string, GeometryBatchItem>} entries Dictionary of all entries in the batch with associated computed values.
 * One entry corresponds to one feature. Key is feature uid.
 * @property {number} geometriesCount Amount of geometries in the batch.
 * @property {number} verticesCount Amount of vertices from geometries in the batch.
 * @property {number} ringsCount How many outer and inner rings in this batch.
 */
/**
 * @typedef {Object} LineStringGeometryBatch A geometry batch specific to lines
 * @property {Object<string, GeometryBatchItem>} entries Dictionary of all entries in the batch with associated computed values.
 * One entry corresponds to one feature. Key is feature uid.
 * @property {number} geometriesCount Amount of geometries in the batch.
 * @property {number} verticesCount Amount of vertices from geometries in the batch.
 */
/**
 * @typedef {Object} PointGeometryBatch A geometry batch specific to points
 * @property {Object<string, GeometryBatchItem>} entries Dictionary of all entries in the batch with associated computed values.
 * One entry corresponds to one feature. Key is feature uid.
 * @property {number} geometriesCount Amount of geometries in the batch.
 */
/**
 * @classdesc This class is used to group several geometries of various types together for faster rendering.
 * Three inner batches are maintained for polygons, lines and points. Each time a feature is added, changed or removed
 * from the batch, these inner batches are modified accordingly in order to keep them up-to-date.
 *
 * A feature can be present in several inner batches, for example a polygon geometry will be present in the polygon batch
 * and its linear rings will be present in the line batch. Multi geometries are also broken down into individual geometries
 * and added to the corresponding batches in a recursive manner.
 *
 * Corresponding {@link module:ol/render/webgl/BatchRenderer} instances are then used to generate the render instructions
 * and WebGL buffers (vertices and indices) for each inner batches; render instructions are stored on the inner batches,
 * alongside the transform used to convert world coords to screen coords at the time these instructions were generated.
 * The resulting WebGL buffers are stored on the batches as well.
 *
 * An important aspect of geometry batches is that there is no guarantee that render instructions and WebGL buffers
 * are synchronized, i.e. render instructions can describe a new state while WebGL buffers might not have been written yet.
 * This is why two world-to-screen transforms are stored on each batch: one for the render instructions and one for
 * the WebGL buffers.
 */
declare class MixedGeometryBatch {
    /**
     * @private
     */
    private globalCounter_;
    /**
     * Refs are used as keys for hit detection.
     * @type {Map<number, Feature|RenderFeature>}
     * @private
     */
    private refToFeature_;
    /**
     * Features are split in "entries", which are individual geometries. We use the following map to share a single ref for all those entries.
     * @type {Map<string, number>}
     * @private
     */
    private uidToRef_;
    /**
     * The precision in WebGL shaders is limited.
     * To keep the refs as small as possible we maintain an array of freed up references.
     * @type {Array<number>}
     * @private
     */
    private freeGlobalRef_;
    /**
     * @type {PolygonGeometryBatch}
     */
    polygonBatch: PolygonGeometryBatch;
    /**
     * @type {PointGeometryBatch}
     */
    pointBatch: PointGeometryBatch;
    /**
     * @type {LineStringGeometryBatch}
     */
    lineStringBatch: LineStringGeometryBatch;
    /**
     * @param {Array<Feature|RenderFeature>} features Array of features to add to the batch
     * @param {import("../../proj.js").TransformFunction} [projectionTransform] Projection transform.
     */
    addFeatures(features: Array<Feature | RenderFeature>, projectionTransform?: TransformFunction): void;
    /**
     * @param {Feature|RenderFeature} feature Feature to add to the batch
     * @param {import("../../proj.js").TransformFunction} [projectionTransform] Projection transform.
     */
    addFeature(feature: Feature | RenderFeature, projectionTransform?: TransformFunction): void;
    /**
     * @param {Feature|RenderFeature} feature Feature
     * @return {GeometryBatchItem|void} the cleared entry
     * @private
     */
    private clearFeatureEntryInPointBatch_;
    /**
     * @param {Feature|RenderFeature} feature Feature
     * @return {GeometryBatchItem|void} the cleared entry
     * @private
     */
    private clearFeatureEntryInLineStringBatch_;
    /**
     * @param {Feature|RenderFeature} feature Feature
     * @return {GeometryBatchItem|void} the cleared entry
     * @private
     */
    private clearFeatureEntryInPolygonBatch_;
    /**
     * @param {import("../../geom.js").Geometry|RenderFeature} geometry Geometry
     * @param {Feature|RenderFeature} feature Feature
     * @private
     */
    private addGeometry_;
    /**
     * @param {GeometryType} type Geometry type
     * @param {Array<number>} flatCoords Flat coordinates
     * @param {Array<number> | Array<Array<number>> | null} ends Coordinate ends
     * @param {Feature|RenderFeature} feature Feature
     * @param {string} featureUid Feature uid
     * @param {number} stride Stride
     * @param {import('../../geom/Geometry.js').GeometryLayout} [layout] Layout
     * @private
     */
    private addCoordinates_;
    /**
     * @param {string} featureUid Feature uid
     * @param {GeometryBatchItem} entry The entry to add
     * @return {GeometryBatchItem} the added entry
     * @private
     */
    private addRefToEntry_;
    /**
     * Return a ref to the pool of available refs.
     * @param {number} ref the ref to return
     * @param {string} featureUid the feature uid
     * @private
     */
    private removeRef_;
    /**
     * @param {Feature|RenderFeature} feature Feature
     * @param {import("../../proj.js").TransformFunction} [projectionTransform] Projection transform.
     */
    changeFeature(feature: Feature | RenderFeature, projectionTransform?: TransformFunction): void;
    /**
     * @param {Feature|RenderFeature} feature Feature
     */
    removeFeature(feature: Feature | RenderFeature): void;
    clear(): void;
    /**
     * Resolve the feature associated to a ref.
     * @param {number} ref Hit detected ref
     * @return {Feature|RenderFeature} feature
     */
    getFeatureFromRef(ref: number): Feature | RenderFeature;
    isEmpty(): boolean;
    /**
     * Will return a new instance of this class that only contains the features
     * for which the provided callback returned true
     * @param {function((Feature|RenderFeature)): boolean} featureFilter Feature filter callback
     * @return {MixedGeometryBatch} Filtered geometry batch
     */
    filter(featureFilter: (arg0: (Feature | RenderFeature)) => boolean): MixedGeometryBatch;
}

/**
 * A description of a custom attribute to be passed on to the GPU, with a value different
 * for each feature.
 */
type AttributeDefinition = {
    /**
     * Amount of numerical values composing the attribute, either 1, 2, 3 or 4; in case size is > 1, the return value
     * of the callback should be an array; if unspecified, assumed to be a single float value
     */
    size?: number | undefined;
    /**
     * This callback computes the numerical value of the
     * attribute for a given feature.
     */
    callback: (this: GeometryBatchItem, arg1: FeatureLike) => number | Array<number>;
};
type AttributeDefinitions = {
    [x: string]: AttributeDefinition;
};
type UniformDefinitions = {
    [x: string]: UniformValue;
};
/**
 * Buffers organized like so: [indicesBuffer, vertexAttributesBuffer, instanceAttributesBuffer]
 */
type WebGLArrayBufferSet = Array<WebGLArrayBuffer>;
type WebGLBuffers = {
    /**
     * Array containing indices and vertices buffers for polygons
     */
    polygonBuffers: WebGLArrayBufferSet;
    /**
     * Array containing indices and vertices buffers for line strings
     */
    lineStringBuffers: WebGLArrayBufferSet;
    /**
     * Array containing indices and vertices buffers for points
     */
    pointBuffers: WebGLArrayBufferSet;
    /**
     * Inverse of the transform applied when generating buffers
     */
    invertVerticesTransform: Transform;
};
type StyleShaders$1 = StyleParseResult;
type FlatStyleLike = FlatStyleLike$1;
/**
 * @typedef {Object} AttributeDefinition A description of a custom attribute to be passed on to the GPU, with a value different
 * for each feature.
 * @property {number} [size] Amount of numerical values composing the attribute, either 1, 2, 3 or 4; in case size is > 1, the return value
 * of the callback should be an array; if unspecified, assumed to be a single float value
 * @property {function(this:import("./MixedGeometryBatch.js").GeometryBatchItem, import("../../Feature").FeatureLike):number|Array<number>} callback This callback computes the numerical value of the
 * attribute for a given feature.
 */
/**
 * @typedef {Object<string, AttributeDefinition>} AttributeDefinitions
 * @typedef {Object<string, import("../../webgl/Helper").UniformValue>} UniformDefinitions
 */
/**
 * @typedef {Array<WebGLArrayBuffer>} WebGLArrayBufferSet Buffers organized like so: [indicesBuffer, vertexAttributesBuffer, instanceAttributesBuffer]
 */
/**
 * @typedef {Object} WebGLBuffers
 * @property {WebGLArrayBufferSet} polygonBuffers Array containing indices and vertices buffers for polygons
 * @property {WebGLArrayBufferSet} lineStringBuffers Array containing indices and vertices buffers for line strings
 * @property {WebGLArrayBufferSet} pointBuffers Array containing indices and vertices buffers for points
 * @property {import("../../transform.js").Transform} invertVerticesTransform Inverse of the transform applied when generating buffers
 */
/**
 * @typedef {Object} RenderInstructions
 * @property {Float32Array|null} polygonInstructions Polygon instructions; null if nothing to render
 * @property {Float32Array|null} lineStringInstructions LineString instructions; null if nothing to render
 * @property {Float32Array|null} pointInstructions Point instructions; null if nothing to render
 */
/**
 * @typedef {Object} ShaderProgram An object containing both shaders (vertex and fragment)
 * @property {string} vertex Vertex shader source
 * @property {string} fragment Fragment shader source
 */
/**
 * @typedef {import('./style.js').StyleParseResult} StyleShaders
 */
/**
 * @typedef {import('../../style/flat.js').FlatStyleLike} FlatStyleLike
 */
/**
 * @typedef {import('../../style/flat.js').FlatStyle} FlatStyle
 */
/**
 * @typedef {import('../../style/flat.js').Rule} FlatStyleRule
 */
/**
 * @typedef {Object} SubRenderPass
 * @property {string} vertexShader Vertex shader
 * @property {string} fragmentShader Fragment shader
 * @property {Array<import('../../webgl/Helper.js').AttributeDescription>} attributesDesc Attributes description, defined for each primitive vertex
 * @property {Array<import('../../webgl/Helper.js').AttributeDescription>} instancedAttributesDesc Attributes description, defined once per primitive
 * @property {number} instancePrimitiveVertexCount Number of vertices per instance primitive in this render pass
 * @property {WebGLProgram} [program] Program; this has to be recreated if the helper is lost/changed
 */
/**
 * @typedef {Object} RenderPass
 * @property {SubRenderPass} [fillRenderPass] Fill render pass; undefined if no fill in pass
 * @property {SubRenderPass} [strokeRenderPass] Stroke render pass; undefined if no stroke in pass
 * @property {SubRenderPass} [symbolRenderPass] Symbol render pass; undefined if no symbol in pass
 */
/**
 * @classdesc This class is responsible for:
 * 1. generating WebGL buffers according to a provided style, using a MixedGeometryBatch as input
 * 2. rendering geometries contained in said buffers
 *
 * A VectorStyleRenderer instance can be created either from a literal style or from shaders.
 * The shaders should not be provided explicitly but instead as a preconfigured ShaderBuilder instance.
 *
 * The `generateBuffers` method returns a promise resolving to WebGL buffers that are intended to be rendered by the
 * same renderer.
 */
declare class VectorStyleRenderer {
    /**
     * @param {FlatStyleLike|StyleShaders|Array<StyleShaders>} styles Vector styles expressed as flat styles, flat style rules or style shaders
     * @param {import('../../style/flat.js').StyleVariables} variables Style variables
     * @param {import('../../webgl/Helper.js').default} helper Helper
     * @param {boolean} [enableHitDetection] Whether to enable the hit detection (needs compatible shader)
     */
    constructor(styles: FlatStyleLike | StyleShaders$1 | Array<StyleShaders$1>, variables: StyleVariables, helper: WebGLHelper, enableHitDetection?: boolean);
    /**
     * @private
     * @type {import('../../webgl/Helper.js').default}
     */
    private helper_;
    /**
     * @private
     */
    private hitDetectionEnabled_;
    /**
     * @type {Array<StyleShaders>}
     * @private
     */
    private styleShaders;
    /**
     * @type {AttributeDefinitions}
     * @private
     */
    private customAttributes_;
    /**
     @type {UniformDefinitions}
     * @private
     */
    private uniforms_;
    /**
     * @type {Array<RenderPass>}
     * @private
     */
    private renderPasses_;
    hasFill_: boolean;
    hasStroke_: boolean;
    hasSymbol_: boolean;
    /**
     * @param {import('./MixedGeometryBatch.js').default} geometryBatch Geometry batch
     * @param {import("../../transform.js").Transform} transform Transform to apply to coordinates
     * @return {Promise<WebGLBuffers|null>} A promise resolving to WebGL buffers; returns null if buffers are empty
     */
    generateBuffers(geometryBatch: MixedGeometryBatch, transform: Transform): Promise<WebGLBuffers | null>;
    /**
     * @param {import('./MixedGeometryBatch.js').default} geometryBatch Geometry batch
     * @param {import("../../transform.js").Transform} transform Transform to apply to coordinates
     * @return {RenderInstructions} Render instructions
     * @private
     */
    private generateRenderInstructions_;
    /**
     * @param {Float32Array|null} renderInstructions Render instructions
     * @param {import("../../geom/Geometry.js").Type} geometryType Geometry type
     * @param {import("../../transform.js").Transform} transform Transform to apply to coordinates
     * @return {Promise<WebGLArrayBufferSet>|null} Indices buffer and vertices buffer; null if nothing to render
     * @private
     */
    private generateBuffersForType_;
    /**
     * Render the geometries in the given buffers.
     * @param {WebGLBuffers} buffers WebGL Buffers to draw
     * @param {import("../../Map.js").FrameState} frameState Frame state
     * @param {function(): void} preRenderCallback This callback will be called right before drawing, and can be used to set uniforms
     */
    render(buffers: WebGLBuffers, frameState: FrameState, preRenderCallback: () => void): void;
    /**
     * @param {WebGLArrayBuffer} indicesBuffer Indices buffer
     * @param {WebGLArrayBuffer} vertexAttributesBuffer Vertex attributes buffer
     * @param {WebGLArrayBuffer} instanceAttributesBuffer Instance attributes buffer
     * @param {SubRenderPass} subRenderPass Render pass (program, attributes, etc.) specific to one geometry type
     * @param {import("../../Map.js").FrameState} frameState Frame state.
     * @param {function(): void} preRenderCallback This callback will be called right before drawing, and can be used to set uniforms
     * @private
     */
    private renderInternal_;
    /**
     * @param {import('../../webgl/Helper.js').default} helper Helper
     * @param {WebGLBuffers} buffers WebGL Buffers to reload if any
     */
    setHelper(helper: WebGLHelper, buffers?: WebGLBuffers): void;
}

type StyleShaders = StyleShaders$1;
type LayerStyle = FlatStyleLike$1 | Array<StyleShaders> | StyleShaders;
type Options$l = {
    /**
     * A CSS class name to set to the canvas element.
     */
    className?: string | undefined;
    /**
     * Flat vector style; also accepts shaders
     */
    style: LayerStyle;
    /**
     * Style variables
     */
    variables: {
        [x: string]: string | number | boolean | number[];
    };
    /**
     * Setting this to true will provide a slight performance boost, but will
     * prevent all hit detection on the layer.
     */
    disableHitDetection?: boolean | undefined;
    /**
     * Post-processes definitions
     */
    postProcesses?: PostProcessesOptions[] | undefined;
};
/**
 * @typedef {import('../../render/webgl/VectorStyleRenderer.js').StyleShaders} StyleShaders
 */
/**
 * @typedef {import('../../style/flat.js').FlatStyleLike | Array<StyleShaders> | StyleShaders} LayerStyle
 */
/**
 * @typedef {Object} Options
 * @property {string} [className='ol-layer'] A CSS class name to set to the canvas element.
 * @property {LayerStyle} style Flat vector style; also accepts shaders
 * @property {Object<string, number|Array<number>|string|boolean>} variables Style variables
 * @property {boolean} [disableHitDetection=false] Setting this to true will provide a slight performance boost, but will
 * prevent all hit detection on the layer.
 * @property {Array<import("./Layer").PostProcessesOptions>} [postProcesses] Post-processes definitions
 */
/**
 * @classdesc
 * Experimental WebGL vector renderer. Supports polygons, lines and points:
 *  Polygons are broken down into triangles
 *  Lines are rendered as strips of quads
 *  Points are rendered as quads
 *
 * You need to provide vertex and fragment shaders as well as custom attributes for each type of geometry. All shaders
 * can access the uniforms in the {@link module:ol/webgl/Helper~DefaultUniform} enum.
 * The vertex shaders can access the following attributes depending on the geometry type:
 *  For polygons: {@link module:ol/render/webgl/PolygonBatchRenderer~Attributes}
 *  For line strings: {@link module:ol/render/webgl/LineStringBatchRenderer~Attributes}
 *  For points: {@link module:ol/render/webgl/PointBatchRenderer~Attributes}
 *
 * Please note that the fragment shaders output should have premultiplied alpha, otherwise visual anomalies may occur.
 *
 * Note: this uses {@link module:ol/webgl/Helper~WebGLHelper} internally.
 */
declare class WebGLVectorLayerRenderer extends WebGLLayerRenderer<any> {
    /**
     * @param {import("../../layer/Layer.js").default} layer Layer.
     * @param {Options} options Options.
     */
    constructor(layer: Layer, options: Options$l);
    /**
     * @type {boolean}
     * @private
     */
    private hitDetectionEnabled_;
    /**
     * @type {WebGLRenderTarget}
     * @private
     */
    private hitRenderTarget_;
    /**
     * @private
     */
    private sourceRevision_;
    /**
     * @private
     */
    private previousExtent_;
    /**
     * This transform is updated on every frame and is the composition of:
     * - invert of the world->screen transform that was used when rebuilding buffers (see `this.renderTransform_`)
     * - current world->screen transform
     * @type {import("../../transform.js").Transform}
     * @private
     */
    private currentTransform_;
    /**
     * @private
     */
    private tmpCoords_;
    /**
     * @private
     */
    private tmpTransform_;
    /**
     * @private
     */
    private tmpMat4_;
    /**
     * @type {import("../../transform.js").Transform}
     * @private
     */
    private currentFrameStateTransform_;
    /**
     * @type {import('../../style/flat.js').StyleVariables}
     * @private
     */
    private styleVariables_;
    /**
     * @type {LayerStyle}
     * @private
     */
    private style_;
    /**
     * @type {VectorStyleRenderer}
     * @public
     */
    public styleRenderer_: VectorStyleRenderer;
    /**
     * @type {import('../../render/webgl/VectorStyleRenderer.js').WebGLBuffers}
     * @private
     */
    private buffers_;
    /**
     * @private
     */
    private batch_;
    /**
     * @private
     * @type {boolean}
     */
    private initialFeaturesAdded_;
    /**
     * @private
     * @type {Array<import("../../events.js").EventsKey|null>}
     */
    private sourceListenKeys_;
    /**
     * @private
     * @param {import("../../Map.js").FrameState} frameState Frame state.
     */
    private addInitialFeatures_;
    /**
     * @param {Options} options Options.
     * @private
     */
    private applyOptions_;
    /**
     * @private
     */
    private createRenderers_;
    /**
     * @override
     */
    override reset(options: any): void;
    /**
     * @param {import("../../proj.js").TransformFunction} projectionTransform Transform function.
     * @param {import("../../source/Vector.js").VectorSourceEvent} event Event.
     * @private
     */
    private handleSourceFeatureAdded_;
    /**
     * @param {import("../../proj.js").TransformFunction} projectionTransform Transform function.
     * @param {import("../../source/Vector.js").VectorSourceEvent} event Event.
     * @private
     */
    private handleSourceFeatureChanged_;
    /**
     * @param {import("../../source/Vector.js").VectorSourceEvent} event Event.
     * @private
     */
    private handleSourceFeatureDelete_;
    /**
     * @private
     */
    private handleSourceFeatureClear_;
    /**
     * @param {import("../../transform.js").Transform} batchInvertTransform Inverse of the transformation in which geometries are expressed
     * @private
     */
    private applyUniforms_;
    /**
     * Render the layer.
     * @param {import("../../Map.js").FrameState} frameState Frame state.
     * @return {HTMLElement} The rendered element.
     * @override
     */
    override renderFrame(frameState: FrameState): HTMLElement;
    /**
     * Render the world, either to the main framebuffer or to the hit framebuffer
     * @param {import("../../Map.js").FrameState} frameState current frame state
     * @param {boolean} forHitDetection whether the rendering is for hit detection
     * @param {number} startWorld the world to render in the first iteration
     * @param {number} endWorld the last world to render
     * @param {number} worldWidth the width of the worlds being rendered
     */
    renderWorlds(frameState: FrameState, forHitDetection: boolean, startWorld: number, endWorld: number, worldWidth: number): void;
    /**
     * Will release a set of Webgl buffers
     * @param {import('../../render/webgl/VectorStyleRenderer.js').WebGLBuffers} buffers Buffers
     */
    disposeBuffers(buffers: WebGLBuffers): void;
    renderDeclutter(): void;
}

type Options$k<VectorSourceType extends VectorSource<FeatureType> = VectorSource<any>, FeatureType extends FeatureLike = ExtractedFeatureType$1<VectorSourceType>> = {
    /**
     * A CSS class name to set to the layer element.
     */
    className?: string | undefined;
    /**
     * Opacity (0, 1).
     */
    opacity?: number | undefined;
    /**
     * Visibility.
     */
    visible?: boolean | undefined;
    /**
     * The bounding extent for layer rendering.  The layer will not be
     * rendered outside of this extent.
     */
    extent?: Extent | undefined;
    /**
     * The z-index for layer rendering.  At rendering time, the layers
     * will be ordered, first by Z-index and then by position. When `undefined`, a `zIndex` of 0 is assumed
     * for layers that are added to the map's `layers` collection, or `Infinity` when the layer's `setMap()`
     * method was used.
     */
    zIndex?: number | undefined;
    /**
     * The minimum resolution (inclusive) at which this layer will be
     * visible.
     */
    minResolution?: number | undefined;
    /**
     * The maximum resolution (exclusive) below which this layer will
     * be visible.
     */
    maxResolution?: number | undefined;
    /**
     * The minimum view zoom level (exclusive) above which this layer will be
     * visible.
     */
    minZoom?: number | undefined;
    /**
     * The maximum view zoom level (inclusive) at which this layer will
     * be visible.
     */
    maxZoom?: number | undefined;
    /**
     * Render order. Function to be used when sorting
     * features before rendering. By default features are drawn in the order that they are created. Use
     * `null` to avoid the sort, but get an undefined draw order.
     */
    renderOrder?: OrderFunction | undefined;
    /**
     * The buffer in pixels around the viewport extent used by the
     * renderer when getting features from the vector source for the rendering or hit-detection.
     * Recommended value: the size of the largest symbol, line width or label.
     */
    renderBuffer?: number | undefined;
    /**
     * Source.
     */
    source?: VectorSourceType | undefined;
    /**
     * Sets the layer as overlay on a map. The map will not manage
     * this layer in its layers collection, and the layer will be rendered on top. This is useful for
     * temporary layers. The standard way to add a layer to a map and have it managed by the map is to
     * use [map.addLayer()]{@link import ("../Map.js").default#addLayer}.
     */
    map?: Map | undefined;
    /**
     * Declutter images and text on this layer. Any truthy value will enable
     * decluttering. The priority is defined by the `zIndex` of the style and the render order of features. Higher z-index means higher
     * priority. Within the same z-index, a feature rendered before another has higher priority. Items will
     * not be decluttered against or together with items on other layers with the same `declutter` value. If
     * that is needed, use {@link import ("../layer/Vector.js").default} instead.
     */
    declutter?: string | number | boolean | undefined;
    /**
     * Layer style. When set to `null`, only
     * features that have their own style will be rendered. See {@link module :ol/style/Style~Style} for the default style
     * which will be used if this is not set.
     */
    style?: StyleLike | FlatStyleLike$1 | null | undefined;
    /**
     * Background color for the layer. If not specified, no background
     * will be rendered.
     */
    background?: BackgroundColor | undefined;
    /**
     * Ratio by which the rendered extent should be larger than the
     * viewport extent. A larger ratio avoids cut images during panning, but will cause a decrease in performance.
     */
    imageRatio?: number | undefined;
    /**
     * Arbitrary observable properties. Can be accessed with `#get()` and `#set()`.
     */
    properties?: {
        [x: string]: any;
    } | undefined;
};
/**
 * @template {import("../source/Vector.js").default<FeatureType>} [VectorSourceType=import("../source/Vector.js").default<*>]
 * @template {import('../Feature.js').FeatureLike} [FeatureType=import("./BaseVector.js").ExtractedFeatureType<VectorSourceType>]
 * @typedef {Object} Options
 * @property {string} [className='ol-layer'] A CSS class name to set to the layer element.
 * @property {number} [opacity=1] Opacity (0, 1).
 * @property {boolean} [visible=true] Visibility.
 * @property {import("../extent.js").Extent} [extent] The bounding extent for layer rendering.  The layer will not be
 * rendered outside of this extent.
 * @property {number} [zIndex] The z-index for layer rendering.  At rendering time, the layers
 * will be ordered, first by Z-index and then by position. When `undefined`, a `zIndex` of 0 is assumed
 * for layers that are added to the map's `layers` collection, or `Infinity` when the layer's `setMap()`
 * method was used.
 * @property {number} [minResolution] The minimum resolution (inclusive) at which this layer will be
 * visible.
 * @property {number} [maxResolution] The maximum resolution (exclusive) below which this layer will
 * be visible.
 * @property {number} [minZoom] The minimum view zoom level (exclusive) above which this layer will be
 * visible.
 * @property {number} [maxZoom] The maximum view zoom level (inclusive) at which this layer will
 * be visible.
 * @property {import("../render.js").OrderFunction} [renderOrder] Render order. Function to be used when sorting
 * features before rendering. By default features are drawn in the order that they are created. Use
 * `null` to avoid the sort, but get an undefined draw order.
 * @property {number} [renderBuffer=100] The buffer in pixels around the viewport extent used by the
 * renderer when getting features from the vector source for the rendering or hit-detection.
 * Recommended value: the size of the largest symbol, line width or label.
 * @property {VectorSourceType} [source] Source.
 * @property {import("../Map.js").default} [map] Sets the layer as overlay on a map. The map will not manage
 * this layer in its layers collection, and the layer will be rendered on top. This is useful for
 * temporary layers. The standard way to add a layer to a map and have it managed by the map is to
 * use [map.addLayer()]{@link import("../Map.js").default#addLayer}.
 * @property {boolean|string|number} [declutter=false] Declutter images and text on this layer. Any truthy value will enable
 * decluttering. The priority is defined by the `zIndex` of the style and the render order of features. Higher z-index means higher
 * priority. Within the same z-index, a feature rendered before another has higher priority. Items will
 * not be decluttered against or together with items on other layers with the same `declutter` value. If
 * that is needed, use {@link import("../layer/Vector.js").default} instead.
 * @property {import("../style/Style.js").StyleLike|import("../style/flat.js").FlatStyleLike|null} [style] Layer style. When set to `null`, only
 * features that have their own style will be rendered. See {@link module:ol/style/Style~Style} for the default style
 * which will be used if this is not set.
 * @property {import("./Base.js").BackgroundColor} [background] Background color for the layer. If not specified, no background
 * will be rendered.
 * @property {number} [imageRatio=1] Ratio by which the rendered extent should be larger than the
 * viewport extent. A larger ratio avoids cut images during panning, but will cause a decrease in performance.
 * @property {Object<string, *>} [properties] Arbitrary observable properties. Can be accessed with `#get()` and `#set()`.
 */
/**
 * @classdesc
 * Vector data is rendered client-side, to an image. This layer type provides great performance
 * during panning and zooming, but point symbols and texts are always rotated with the view and
 * pixels are scaled during zoom animations. For more accurate rendering of vector data, use
 * {@link module:ol/layer/Vector~VectorLayer} instead.
 *
 * Note that any property set in the options is set as a {@link module:ol/Object~BaseObject}
 * property on the layer object; for example, setting `title: 'My Title'` in the
 * options means that `title` is observable, and has get/set accessors.
 *
 * @template {import("../source/Vector.js").default<FeatureType>} [VectorSourceType=import("../source/Vector.js").default<*>]
 * @template {import('../Feature.js').FeatureLike} [FeatureType=import("./BaseVector.js").ExtractedFeatureType<VectorSourceType>]
 * @extends {BaseVectorLayer<FeatureType, VectorSourceType, CanvasVectorImageLayerRenderer>}
 * @api
 */
declare class VectorImageLayer<VectorSourceType extends VectorSource<FeatureType> = VectorSource<any>, FeatureType extends FeatureLike = ExtractedFeatureType$1<VectorSourceType>> extends BaseVectorLayer<FeatureType, VectorSourceType, CanvasVectorImageLayerRenderer> {
    /**
     * @param {Options<VectorSourceType, FeatureType>} [options] Options.
     */
    constructor(options?: Options$k<VectorSourceType, FeatureType>);
    /**
     * @type {number}
     * @private
     */
    private imageRatio_;
    /**
     * @return {number} Ratio between rendered extent size and viewport extent size.
     */
    getImageRatio(): number;
}

/**
 * @typedef {'imageloadend'|'imageloaderror'|'imageloadstart'} ImageSourceEventTypes
 */
/**
 * @classdesc
 * Events emitted by {@link module:ol/source/Image~ImageSource} instances are instances of this
 * type.
 */
declare class ImageSourceEvent extends BaseEvent {
    /**
     * @param {string} type Type.
     * @param {import("../Image.js").default} image The image.
     */
    constructor(type: string, image: ImageWrapper);
    /**
     * The image related to the event.
     * @type {import("../Image.js").default}
     * @api
     */
    image: ImageWrapper;
}

type ImageSourceEventTypes = "imageloadend" | "imageloaderror" | "imageloadstart";
/**
 * *
 */
type ImageSourceOnSignature<Return> = OnSignature<EventTypes, BaseEvent, Return> & OnSignature<Types$2, ObjectEvent, Return> & OnSignature<ImageSourceEventTypes, ImageSourceEvent, Return> & CombinedOnSignature<EventTypes | Types$2 | ImageSourceEventTypes, Return>;
type Options$j = {
    /**
     * Attributions.
     */
    attributions?: AttributionLike | undefined;
    /**
     * Use interpolated values when resampling.  By default,
     * linear interpolation is used when resampling.  Set to false to use the nearest neighbor instead.
     */
    interpolate?: boolean | undefined;
    /**
     * Loader. Can either be a custom loader, or one of the
     * loaders created with a `createLoader()` function ({@link module :ol/source/wms.createLoader wms},
     * {@link module :ol/source/arcgisRest.createLoader arcgisRest}, {@link module :ol/source/mapguide.createLoader mapguide},
     * {@link module :ol/source/static.createLoader static}).
     */
    loader?: Loader$2 | undefined;
    /**
     * Projection.
     */
    projection?: ProjectionLike;
    /**
     * Resolutions.
     */
    resolutions?: number[] | undefined;
    /**
     * State.
     */
    state?: State | undefined;
};

/***
 * @template Return
 * @typedef {import("../Observable").OnSignature<import("../Observable").EventTypes, import("../events/Event.js").default, Return> &
 *   import("../Observable").OnSignature<import("../ObjectEventType").Types, import("../Object").ObjectEvent, Return> &
 *   import("../Observable").OnSignature<ImageSourceEventTypes, ImageSourceEvent, Return> &
 *   import("../Observable").CombinedOnSignature<import("../Observable").EventTypes|import("../ObjectEventType").Types
 *     |ImageSourceEventTypes, Return>} ImageSourceOnSignature
 */
/**
 * @typedef {Object} Options
 * @property {import("./Source.js").AttributionLike} [attributions] Attributions.
 * @property {boolean} [interpolate=true] Use interpolated values when resampling.  By default,
 * linear interpolation is used when resampling.  Set to false to use the nearest neighbor instead.
 * @property {import("../Image.js").Loader} [loader] Loader. Can either be a custom loader, or one of the
 * loaders created with a `createLoader()` function ({@link module:ol/source/wms.createLoader wms},
 * {@link module:ol/source/arcgisRest.createLoader arcgisRest}, {@link module:ol/source/mapguide.createLoader mapguide},
 * {@link module:ol/source/static.createLoader static}).
 * @property {import("../proj.js").ProjectionLike} [projection] Projection.
 * @property {Array<number>} [resolutions] Resolutions.
 * @property {import("./Source.js").State} [state] State.
 */
/**
 * @classdesc
 * Base class for sources providing a single image.
 * @fires module:ol/source/Image.ImageSourceEvent
 * @api
 */
declare class ImageSource extends Source {
    /**
     * @param {Options} options Single image source options.
     */
    constructor(options: Options$j);
    /***
     * @type {ImageSourceOnSignature<import("../events").EventsKey>}
     */
    on: ImageSourceOnSignature<EventsKey>;
    /***
     * @type {ImageSourceOnSignature<import("../events").EventsKey>}
     */
    once: ImageSourceOnSignature<EventsKey>;
    /***
     * @type {ImageSourceOnSignature<void>}
     */
    un: ImageSourceOnSignature<void>;
    /**
     * @protected
     * @type {import("../Image.js").Loader}
     */
    protected loader: Loader$2;
    /**
     * @private
     * @type {Array<number>|null}
     */
    private resolutions_;
    /**
     * @private
     * @type {import("../reproj/Image.js").default}
     */
    private reprojectedImage_;
    /**
     * @private
     * @type {number}
     */
    private reprojectedRevision_;
    /**
     * @protected
     * @type {import("../Image.js").default}
     */
    protected image: ImageWrapper;
    /**
     * @private
     * @type {import("../extent.js").Extent}
     */
    private wantedExtent_;
    /**
     * @private
     * @type {number}
     */
    private wantedResolution_;
    /**
     * @private
     * @type {boolean}
     */
    private static_;
    /**
     * @private
     * @type {import("../proj/Projection.js").default}
     */
    private wantedProjection_;
    /**
     * @return {Array<number>|null} Resolutions.
     * @override
     */
    override getResolutions(): Array<number> | null;
    /**
     * @param {Array<number>|null} resolutions Resolutions.
     */
    setResolutions(resolutions: Array<number> | null): void;
    /**
     * @protected
     * @param {number} resolution Resolution.
     * @return {number} Resolution.
     */
    protected findNearestResolution(resolution: number): number;
    /**
     * @param {import("../extent.js").Extent} extent Extent.
     * @param {number} resolution Resolution.
     * @param {number} pixelRatio Pixel ratio.
     * @param {import("../proj/Projection.js").default} projection Projection.
     * @return {import("../Image.js").default} Single image.
     */
    getImage(extent: Extent, resolution: number, pixelRatio: number, projection: Projection): ImageWrapper;
    /**
     * @abstract
     * @param {import("../extent.js").Extent} extent Extent.
     * @param {number} resolution Resolution.
     * @param {number} pixelRatio Pixel ratio.
     * @param {import("../proj/Projection.js").default} projection Projection.
     * @return {import("../Image.js").default} Single image.
     * @protected
     */
    protected getImageInternal(extent: Extent, resolution: number, pixelRatio: number, projection: Projection): ImageWrapper;
    /**
     * Handle image change events.
     * @param {import("../events/Event.js").default} event Event.
     * @protected
     */
    protected handleImageChange(event: BaseEvent): void;
}

type Options$i<ImageSourceType extends ImageSource> = {
    /**
     * A CSS class name to set to the layer element.
     */
    className?: string | undefined;
    /**
     * Opacity (0, 1).
     */
    opacity?: number | undefined;
    /**
     * Visibility.
     */
    visible?: boolean | undefined;
    /**
     * The bounding extent for layer rendering.  The layer will not be
     * rendered outside of this extent.
     */
    extent?: Extent | undefined;
    /**
     * The z-index for layer rendering.  At rendering time, the layers
     * will be ordered, first by Z-index and then by position. When `undefined`, a `zIndex` of 0 is assumed
     * for layers that are added to the map's `layers` collection, or `Infinity` when the layer's `setMap()`
     * method was used.
     */
    zIndex?: number | undefined;
    /**
     * The minimum resolution (inclusive) at which this layer will be
     * visible.
     */
    minResolution?: number | undefined;
    /**
     * The maximum resolution (exclusive) below which this layer will
     * be visible.
     */
    maxResolution?: number | undefined;
    /**
     * The minimum view zoom level (exclusive) above which this layer will be
     * visible.
     */
    minZoom?: number | undefined;
    /**
     * The maximum view zoom level (inclusive) at which this layer will
     * be visible.
     */
    maxZoom?: number | undefined;
    /**
     * Sets the layer as overlay on a map. The map will not manage
     * this layer in its layers collection, and the layer will be rendered on top. This is useful for
     * temporary layers. The standard way to add a layer to a map and have it managed by the map is to
     * use {@link import ("../Map.js").default#addLayer map.addLayer()}.
     */
    map?: Map | undefined;
    /**
     * Source for this layer.
     */
    source?: ImageSourceType | undefined;
    /**
     * Arbitrary observable properties. Can be accessed with `#get()` and `#set()`.
     */
    properties?: {
        [x: string]: any;
    } | undefined;
};
/**
 * @template {import("../source/Image.js").default} ImageSourceType
 * @typedef {Object} Options
 * @property {string} [className='ol-layer'] A CSS class name to set to the layer element.
 * @property {number} [opacity=1] Opacity (0, 1).
 * @property {boolean} [visible=true] Visibility.
 * @property {import("../extent.js").Extent} [extent] The bounding extent for layer rendering.  The layer will not be
 * rendered outside of this extent.
 * @property {number} [zIndex] The z-index for layer rendering.  At rendering time, the layers
 * will be ordered, first by Z-index and then by position. When `undefined`, a `zIndex` of 0 is assumed
 * for layers that are added to the map's `layers` collection, or `Infinity` when the layer's `setMap()`
 * method was used.
 * @property {number} [minResolution] The minimum resolution (inclusive) at which this layer will be
 * visible.
 * @property {number} [maxResolution] The maximum resolution (exclusive) below which this layer will
 * be visible.
 * @property {number} [minZoom] The minimum view zoom level (exclusive) above which this layer will be
 * visible.
 * @property {number} [maxZoom] The maximum view zoom level (inclusive) at which this layer will
 * be visible.
 * @property {import("../Map.js").default} [map] Sets the layer as overlay on a map. The map will not manage
 * this layer in its layers collection, and the layer will be rendered on top. This is useful for
 * temporary layers. The standard way to add a layer to a map and have it managed by the map is to
 * use {@link import("../Map.js").default#addLayer map.addLayer()}.
 * @property {ImageSourceType} [source] Source for this layer.
 * @property {Object<string, *>} [properties] Arbitrary observable properties. Can be accessed with `#get()` and `#set()`.
 */
/**
 * @classdesc
 * Server-rendered images that are available for arbitrary extents and
 * resolutions.
 * Note that any property set in the options is set as a {@link module:ol/Object~BaseObject}
 * property on the layer object; for example, setting `title: 'My Title'` in the
 * options means that `title` is observable, and has get/set accessors.
 *
 * @template {import("../source/Image.js").default} ImageSourceType
 * @template {import("../renderer/Layer.js").default} RendererType
 * @extends {Layer<ImageSourceType, RendererType>}
 * @api
 */
declare class BaseImageLayer<ImageSourceType extends ImageSource, RendererType extends LayerRenderer<any>> extends Layer<ImageSourceType, RendererType> {
    /**
     * @param {Options<ImageSourceType>} [options] Layer options.
     */
    constructor(options?: Options$i<ImageSourceType>);
}

/**
 * @classdesc
 * Server-rendered images that are available for arbitrary extents and
 * resolutions.
 * Note that any property set in the options is set as a {@link module:ol/Object~BaseObject}
 * property on the layer object; for example, setting `title: 'My Title'` in the
 * options means that `title` is observable, and has get/set accessors.
 *
 * @template {import("../source/Image.js").default} ImageSourceType
 * @extends {BaseImageLayer<ImageSourceType, CanvasImageLayerRenderer>}
 * @api
 */
declare class ImageLayer<ImageSourceType extends ImageSource> extends BaseImageLayer<ImageSourceType, CanvasImageLayerRenderer> {
    /**
     * @param {import("./BaseImage.js").Options<ImageSourceType>} [options] Layer options.
     */
    constructor(options?: Options$i<ImageSourceType>);
}
//# sourceMappingURL=Image.d.ts.map

/**
 * @abstract
 * @template {import("../../layer/Layer.js").default} LayerType
 * @extends {LayerRenderer<LayerType>}
 */
declare class CanvasLayerRenderer<LayerType extends Layer> extends LayerRenderer<LayerType> {
    /**
     * HTMLElement container for the layer to be rendered in.
     * @protected
     * @type {HTMLElement}
     */
    protected container: HTMLElement;
    /**
     * @protected
     * @type {number}
     */
    protected renderedResolution: number;
    /**
     * A temporary transform.  The values in this transform should only be used in a
     * function that sets the values.
     * @protected
     * @type {import("../../transform.js").Transform}
     */
    protected tempTransform: Transform;
    /**
     * The transform for rendered pixels to viewport CSS pixels.  This transform must
     * be set when rendering a frame and may be used by other functions after rendering.
     * @protected
     * @type {import("../../transform.js").Transform}
     */
    protected pixelTransform: Transform;
    /**
     * The transform for viewport CSS pixels to rendered pixels.  This transform must
     * be set when rendering a frame and may be used by other functions after rendering.
     * @protected
     * @type {import("../../transform.js").Transform}
     */
    protected inversePixelTransform: Transform;
    /**
     * @type {CanvasRenderingContext2D|OffscreenCanvasRenderingContext2D}
     */
    context: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D;
    /**
     * @private
     * @type {ZIndexContext}
     */
    private deferredContext_;
    /**
     * true if the container has been reused from the previous renderer
     * @type {boolean}
     */
    containerReused: boolean;
    /**
     * @protected
     * @type {import("../../Map.js").FrameState|null}
     */
    protected frameState: FrameState | null;
    /**
     * @param {import('../../DataTile.js').ImageLike} image Image.
     * @param {number} col The column index.
     * @param {number} row The row index.
     * @return {Uint8ClampedArray|null} The image data.
     */
    getImageData(image: ImageLike, col: number, row: number): Uint8ClampedArray | null;
    /**
     * @param {import('../../Map.js').FrameState} frameState Frame state.
     * @return {string} Background color.
     */
    getBackground(frameState: FrameState): string;
    /**
     * Get a rendering container from an existing target, if compatible.
     * @param {HTMLElement} target Potential render target.
     * @param {string} transform CSS transform matrix.
     * @param {string} [backgroundColor] Background color.
     */
    useContainer(target: HTMLElement, transform: string, backgroundColor?: string): void;
    /**
     * @param {CanvasRenderingContext2D|OffscreenCanvasRenderingContext2D} context Context.
     * @param {import("../../Map.js").FrameState} frameState Frame state.
     * @param {import("../../extent.js").Extent} extent Clip extent.
     * @protected
     */
    protected clipUnrotated(context: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D, frameState: FrameState, extent: Extent): void;
    /**
     * @param {import("../../Map.js").FrameState} frameState Frame state.
     * @param {HTMLElement} target Target that may be used to render content to.
     * @protected
     */
    protected prepareContainer(frameState: FrameState, target: HTMLElement): void;
    /**
     * @param {import("../../render/EventType.js").default} type Event type.
     * @param {CanvasRenderingContext2D|OffscreenCanvasRenderingContext2D} context Context.
     * @param {import("../../Map.js").FrameState} frameState Frame state.
     * @private
     */
    private dispatchRenderEvent_;
    /**
     * @param {CanvasRenderingContext2D|OffscreenCanvasRenderingContext2D} context Context.
     * @param {import("../../Map.js").FrameState} frameState Frame state.
     * @protected
     */
    protected preRender(context: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D, frameState: FrameState): void;
    /**
     * @param {CanvasRenderingContext2D|OffscreenCanvasRenderingContext2D} context Context.
     * @param {import("../../Map.js").FrameState} frameState Frame state.
     * @protected
     */
    protected postRender(context: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D, frameState: FrameState): void;
    /**
     * @param {import("../../Map.js").FrameState} frameState Frame state.
     */
    renderDeferredInternal(frameState: FrameState): void;
    /**
     * @param {import("../../Map.js").FrameState} frameState Frame state.
     * @return {import('../../render/canvas/ZIndexContext.js').ZIndexContextProxy} Context.
     */
    getRenderContext(frameState: FrameState): ZIndexContextProxy;
    /**
     * Creates a transform for rendering to an element that will be rotated after rendering.
     * @param {import("../../coordinate.js").Coordinate} center Center.
     * @param {number} resolution Resolution.
     * @param {number} rotation Rotation.
     * @param {number} pixelRatio Pixel ratio.
     * @param {number} width Width of the rendered element (in pixels).
     * @param {number} height Height of the rendered element (in pixels).
     * @param {number} offsetX Offset on the x-axis in view coordinates.
     * @protected
     * @return {!import("../../transform.js").Transform} Transform.
     */
    protected getRenderTransform(center: Coordinate, resolution: number, rotation: number, pixelRatio: number, width: number, height: number, offsetX: number): Transform;
}

/**
 * @classdesc
 * Canvas renderer for image layers.
 * @api
 */
declare class CanvasImageLayerRenderer extends CanvasLayerRenderer<any> {
    /**
     * @param {import("../../layer/Image.js").default} imageLayer Image layer.
     */
    constructor(imageLayer: ImageLayer<any>);
    /**
     * @protected
     * @type {?import("../../Image.js").default}
     */
    protected image: ImageWrapper | null;
    /**
     * @return {import('../../DataTile.js').ImageLike} Image.
     */
    getImage(): ImageLike;
    /**
     * @param {import("../../pixel.js").Pixel} pixel Pixel.
     * @return {Uint8ClampedArray} Data at the pixel location.
     * @override
     */
    override getData(pixel: Pixel): Uint8ClampedArray;
    /**
     * Render the layer.
     * @param {import("../../Map.js").FrameState} frameState Frame state.
     * @param {HTMLElement} target Target that may be used to render content to.
     * @return {HTMLElement} The rendered element.
     * @override
     */
    override renderFrame(frameState: FrameState, target: HTMLElement): HTMLElement;
}
//# sourceMappingURL=ImageLayer.d.ts.map

/**
 * @classdesc
 * Canvas renderer for image layers.
 * @api
 */
declare class CanvasVectorImageLayerRenderer extends CanvasImageLayerRenderer {
    /**
     * @param {import("../../layer/VectorImage.js").default} layer Vector image layer.
     */
    constructor(layer: VectorImageLayer);
    /**
     * @private
     * @type {import("./VectorLayer.js").default}
     */
    private vectorRenderer_;
    /**
     * @private
     * @type {number}
     */
    private layerImageRatio_;
    /**
     * @private
     * @type {import("../../transform.js").Transform}
     */
    private coordinateToVectorPixelTransform_;
    /**
     * @private
     * @type {import("../../transform.js").Transform}
     */
    private renderedPixelToCoordinateTransform_;
    /**
     * Asynchronous layer level hit detection.
     * @param {import("../../pixel.js").Pixel} pixel Pixel.
     * @return {Promise<Array<import("../../Feature").default>>} Promise that resolves with an array of features.
     * @override
     */
    override getFeatures(pixel: Pixel): Promise<Array<Feature$1>>;
    /**
     * @override
     */
    override preRender(): void;
    /**
     * @override
     */
    override postRender(): void;
    /**
     */
    renderDeclutter(): void;
}
//# sourceMappingURL=VectorImageLayer.d.ts.map

declare class ExecutorGroup {
    /**
     * @param {import("../../extent.js").Extent} maxExtent Max extent for clipping. When a
     * `maxExtent` was set on the Builder for this executor group, the same `maxExtent`
     * should be set here, unless the target context does not exceed that extent (which
     * can be the case when rendering to tiles).
     * @param {number} resolution Resolution.
     * @param {number} pixelRatio Pixel ratio.
     * @param {boolean} overlaps The executor group can have overlapping geometries.
     * @param {!Object<string, !Object<import("../canvas.js").BuilderType, import("../canvas.js").SerializableInstructions>>} allInstructions
     * The serializable instructions.
     * @param {number} [renderBuffer] Optional rendering buffer.
     * @param {boolean} [deferredRendering] Enable deferred rendering with renderDeferred().
     */
    constructor(maxExtent: Extent, resolution: number, pixelRatio: number, overlaps: boolean, allInstructions: {
        [x: string]: any;
    }, renderBuffer?: number, deferredRendering?: boolean);
    /**
     * @private
     * @type {import("../../extent.js").Extent}
     */
    private maxExtent_;
    /**
     * @private
     * @type {boolean}
     */
    private overlaps_;
    /**
     * @private
     * @type {number}
     */
    private pixelRatio_;
    /**
     * @private
     * @type {number}
     */
    private resolution_;
    /**
     * @private
     * @type {number|undefined}
     */
    private renderBuffer_;
    /**
     * @private
     * @type {!Object<string, !Object<string, import("./Executor").default>>}
     */
    private executorsByZIndex_;
    /**
     * @private
     * @type {CanvasRenderingContext2D|OffscreenCanvasRenderingContext2D}
     */
    private hitDetectionContext_;
    /**
     * @private
     * @type {import("../../transform.js").Transform}
     */
    private hitDetectionTransform_;
    /**
     * @private
     * @type {CanvasRenderingContext2D|OffscreenCanvasRenderingContext2D}
     */
    private renderedContext_;
    /**
     * @private
     * @type {Object<number, Array<import("./ZIndexContext.js").default>>}
     */
    private deferredZIndexContexts_;
    /**
     * @param {CanvasRenderingContext2D|OffscreenCanvasRenderingContext2D} context Context.
     * @param {import("../../transform.js").Transform} transform Transform.
     */
    clip(context: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D, transform: Transform): void;
    /**
     * Create executors and populate them using the provided instructions.
     * @private
     * @param {!Object<string, !Object<string, import("../canvas.js").SerializableInstructions>>} allInstructions The serializable instructions
     * @param {boolean} deferredRendering Enable deferred rendering.
     */
    private createExecutors_;
    /**
     * @param {Array<import("../canvas.js").BuilderType>} executors Executors.
     * @return {boolean} Has executors of the provided types.
     */
    hasExecutors(executors: Array<BuilderType>): boolean;
    /**
     * @param {import("../../coordinate.js").Coordinate} coordinate Coordinate.
     * @param {number} resolution Resolution.
     * @param {number} rotation Rotation.
     * @param {number} hitTolerance Hit tolerance in pixels.
     * @param {function(import("../../Feature.js").FeatureLike, import("../../geom/SimpleGeometry.js").default, number): T} callback Feature callback.
     * @param {Array<import("../../Feature.js").FeatureLike>} declutteredFeatures Decluttered features.
     * @return {T|undefined} Callback result.
     * @template T
     */
    forEachFeatureAtCoordinate<T>(coordinate: Coordinate, resolution: number, rotation: number, hitTolerance: number, callback: (arg0: FeatureLike, arg1: SimpleGeometry, arg2: number) => T, declutteredFeatures: Array<FeatureLike>): T | undefined;
    /**
     * @param {import("../../transform.js").Transform} transform Transform.
     * @return {Array<number>|null} Clip coordinates.
     */
    getClipCoords(transform: Transform): Array<number> | null;
    /**
     * @return {boolean} Is empty.
     */
    isEmpty(): boolean;
    /**
     * @param {CanvasRenderingContext2D|OffscreenCanvasRenderingContext2D} targetContext Context.
     * @param {import('../../size.js').Size} scaledCanvasSize Scale of the context.
     * @param {import("../../transform.js").Transform} transform Transform.
     * @param {number} viewRotation View rotation.
     * @param {boolean} snapToPixel Snap point symbols and test to integer pixel.
     * @param {Array<import("../canvas.js").BuilderType>} [builderTypes] Ordered replay types to replay.
     *     Default is {@link module:ol/render/replay~ALL}
     * @param {import("rbush").default<import('./Executor.js').DeclutterEntry>|null} [declutterTree] Declutter tree.
     *     When set to null, no decluttering is done, even when the executor group has a `ZIndexContext`.
     */
    execute(targetContext: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D, scaledCanvasSize: Size, transform: Transform, viewRotation: number, snapToPixel: boolean, builderTypes?: Array<BuilderType>, declutterTree?: rbush.default<DeclutterEntry> | null): void;
    getDeferredZIndexContexts(): {
        [x: number]: ZIndexContext[];
    };
    getRenderedContext(): OffscreenCanvasRenderingContext2D | CanvasRenderingContext2D;
    renderDeferred(): void;
}

/**
 * @template {import('./Feature.js').FeatureLike} FeatureType
 */
declare class VectorTile$1<FeatureType extends FeatureLike> extends Tile {
    /**
     * @param {import("./tilecoord.js").TileCoord} tileCoord Tile coordinate.
     * @param {import("./TileState.js").default} state State.
     * @param {string} src Data source url.
     * @param {import("./format/Feature.js").default<FeatureType>} format Feature format.
     * @param {import("./Tile.js").LoadFunction} tileLoadFunction Tile load function.
     * @param {import("./Tile.js").Options} [options] Tile options.
     */
    constructor(tileCoord: TileCoord, state: any, src: string, format: FeatureFormat<FeatureType>, tileLoadFunction: LoadFunction, options?: Options$D);
    /**
     * Extent of this tile; set by the source.
     * @type {import("./extent.js").Extent}
     */
    extent: Extent;
    /**
     * @private
     * @type {import("./format/Feature.js").default<FeatureType>}
     */
    private format_;
    /**
     * @private
     * @type {Array<FeatureType>}
     */
    private features_;
    /**
     * @private
     * @type {import("./featureloader.js").FeatureLoader}
     */
    private loader_;
    /**
     * Feature projection of this tile; set by the source.
     * @type {import("./proj/Projection.js").default}
     */
    projection: Projection;
    /**
     * Resolution of this tile; set by the source.
     * @type {number}
     */
    resolution: number;
    /**
     * @private
     * @type {import("./Tile.js").LoadFunction}
     */
    private tileLoadFunction_;
    /**
     * @private
     * @type {string}
     */
    private url_;
    /**
     * @return {string} Tile url.
     */
    getTileUrl(): string;
    /**
     * Get the feature format assigned for reading this tile's features.
     * @return {import("./format/Feature.js").default<FeatureType>} Feature format.
     * @api
     */
    getFormat(): FeatureFormat<FeatureType>;
    /**
     * Get the features for this tile. Geometries will be in the view projection.
     * @return {Array<FeatureType>} Features.
     * @api
     */
    getFeatures(): Array<FeatureType>;
    /**
     * Handler for successful tile load.
     * @param {Array<FeatureType>} features The loaded features.
     * @param {import("./proj/Projection.js").default} dataProjection Data projection.
     */
    onLoad(features: Array<FeatureType>, dataProjection: Projection): void;
    /**
     * Handler for tile load errors.
     */
    onError(): void;
    /**
     * Function for use in a {@link module:ol/source/VectorTile~VectorTile}'s `tileLoadFunction`.
     * Sets the features for the tile.
     * @param {Array<FeatureType>} features Features.
     * @api
     */
    setFeatures(features: Array<FeatureType>): void;
    /**
     * Set the feature loader for reading this tile's features.
     * @param {import("./featureloader.js").FeatureLoader<FeatureType>} loader Feature loader.
     * @api
     */
    setLoader(loader: FeatureLoader<FeatureType>): void;
}
//# sourceMappingURL=VectorTile.d.ts.map

type ReplayState = {
    /**
     * Dirty.
     */
    dirty: boolean;
    /**
     * RenderedRenderOrder.
     */
    renderedRenderOrder: null | OrderFunction;
    /**
     * RenderedTileRevision.
     */
    renderedTileRevision: number;
    /**
     * RenderedResolution.
     */
    renderedResolution: number;
    /**
     * RenderedRevision.
     */
    renderedRevision: number;
    /**
     * RenderedTileResolution.
     */
    renderedTileResolution: number;
    /**
     * RenderedTileZ.
     */
    renderedTileZ: number;
};
declare class VectorRenderTile extends Tile {
    /**
     * @param {import("./tilecoord.js").TileCoord} tileCoord Tile coordinate.
     * @param {import("./TileState.js").default} state State.
     * @param {import("./tilecoord.js").TileCoord} urlTileCoord Wrapped tile coordinate for source urls.
     * @param {function(VectorRenderTile):Array<import("./VectorTile").default>} getSourceTiles Function.
     * @param {function(VectorRenderTile):void} removeSourceTiles Function.
     */
    constructor(tileCoord: TileCoord, state: any, urlTileCoord: TileCoord, getSourceTiles: (arg0: VectorRenderTile) => Array<VectorTile$1<any>>, removeSourceTiles: (arg0: VectorRenderTile) => void);
    /**
     * @private
     * @type {CanvasRenderingContext2D|OffscreenCanvasRenderingContext2D|null}
     */
    private context_;
    /**
     * Executor groups. Read/written by the renderer.
     * @type {Object<string, Array<import("./render/canvas/ExecutorGroup.js").default>>}
     */
    executorGroups: {
        [x: string]: ExecutorGroup[];
    };
    /**
     * Number of loading source tiles. Read/written by the source.
     * @type {number}
     */
    loadingSourceTiles: number;
    /**
     * @type {Object<string, ImageData>}
     */
    hitDetectionImageData: {
        [x: string]: ImageData;
    };
    /**
     * @private
     * @type {!Object<string, ReplayState>}
     */
    private replayState_;
    /**
     * @type {Array<import("./VectorTile.js").default>}
     */
    sourceTiles: Array<VectorTile$1<any>>;
    /**
     * @type {Object<string, boolean>}
     */
    errorTileKeys: {
        [x: string]: boolean;
    };
    /**
     * @type {number}
     */
    wantedResolution: number;
    /**
     * @type {!function():Array<import("./VectorTile.js").default>}
     */
    getSourceTiles: () => Array<VectorTile$1<any>>;
    /**
     * @type {!function(VectorRenderTile):void}
     * @private
     */
    private removeSourceTiles_;
    /**
     * @type {import("./tilecoord.js").TileCoord}
     */
    wrappedTileCoord: TileCoord;
    /**
     * @return {CanvasRenderingContext2D|OffscreenCanvasRenderingContext2D} The rendering context.
     */
    getContext(): CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D;
    /**
     * @return {boolean} Tile has a rendering context.
     */
    hasContext(): boolean;
    /**
     * Get the Canvas for this tile.
     * @return {HTMLCanvasElement|OffscreenCanvas} Canvas.
     */
    getImage(): HTMLCanvasElement | OffscreenCanvas;
    /**
     * @param {import("./layer/Layer.js").default} layer Layer.
     * @return {ReplayState} The replay state.
     */
    getReplayState(layer: Layer): ReplayState;
}

declare class ImageTile extends Tile {
    /**
     * @param {import("./tilecoord.js").TileCoord} tileCoord Tile coordinate.
     * @param {import("./TileState.js").default} state State.
     * @param {string} src Image source URI.
     * @param {?string} crossOrigin Cross origin.
     * @param {import("./Tile.js").LoadFunction} tileLoadFunction Tile load function.
     * @param {import("./Tile.js").Options} [options] Tile options.
     */
    constructor(tileCoord: TileCoord, state: any, src: string, crossOrigin: string | null, tileLoadFunction: LoadFunction, options?: Options$D);
    /**
     * @private
     * @type {?string}
     */
    private crossOrigin_;
    /**
     * Image URI
     *
     * @private
     * @type {string}
     */
    private src_;
    /**
     * @private
     * @type {HTMLImageElement|HTMLCanvasElement|OffscreenCanvas}
     */
    private image_;
    /**
     * @private
     * @type {?function():void}
     */
    private unlisten_;
    /**
     * @private
     * @type {import("./Tile.js").LoadFunction}
     */
    private tileLoadFunction_;
    /**
     * Get the HTML image element for this tile (may be a Canvas, OffscreenCanvas, Image, or Video).
     * @return {HTMLCanvasElement|OffscreenCanvas|HTMLImageElement|HTMLVideoElement} Image.
     * @api
     */
    getImage(): HTMLCanvasElement | OffscreenCanvas | HTMLImageElement | HTMLVideoElement;
    /**
     * Sets an HTML image element for this tile (may be a Canvas or preloaded Image).
     * @param {HTMLCanvasElement|OffscreenCanvas|HTMLImageElement} element Element.
     */
    setImage(element: HTMLCanvasElement | OffscreenCanvas | HTMLImageElement): void;
    /**
     * Get the cross origin of the ImageTile.
     * @return {string} Cross origin.
     */
    getCrossOrigin(): string;
    /**
     * Tracks loading or read errors.
     *
     * @private
     */
    private handleImageError_;
    /**
     * Tracks successful image load.
     *
     * @private
     */
    private handleImageLoad_;
    /**
     * Discards event handlers which listen for load completion or errors.
     *
     * @private
     */
    private unlistenImage_;
}
//# sourceMappingURL=ImageTile.d.ts.map

type Options$h = {
    /**
     * Attributions.
     */
    attributions?: AttributionLike | undefined;
    /**
     * Attributions are collapsible.
     */
    attributionsCollapsible?: boolean | undefined;
    /**
     * Deprecated.  Use the cacheSize option on the layer instead.
     */
    cacheSize?: number | undefined;
    /**
     * Projection.
     */
    projection?: ProjectionLike;
    /**
     * State.
     */
    state?: State | undefined;
    /**
     * TileGrid.
     */
    tileGrid?: TileGrid | undefined;
    /**
     * TileLoadFunction.
     */
    tileLoadFunction: LoadFunction;
    /**
     * TilePixelRatio.
     */
    tilePixelRatio?: number | undefined;
    /**
     * Deprecated.  Use an ImageTile source and provide a function
     * for the url option instead.
     */
    tileUrlFunction?: UrlFunction | undefined;
    /**
     * Url.
     */
    url?: string | undefined;
    /**
     * Urls.
     */
    urls?: string[] | undefined;
    /**
     * WrapX.
     */
    wrapX?: boolean | undefined;
    /**
     * Transition.
     */
    transition?: number | undefined;
    /**
     * Key.
     */
    key?: string | undefined;
    /**
     * ZDirection.
     */
    zDirection?: number | NearestDirectionFunction | undefined;
    /**
     * Use interpolated values when resampling.  By default,
     * the nearest neighbor is used when resampling.
     */
    interpolate?: boolean | undefined;
};
/**
 * @typedef {Object} Options
 * @property {import("./Source.js").AttributionLike} [attributions] Attributions.
 * @property {boolean} [attributionsCollapsible=true] Attributions are collapsible.
 * @property {number} [cacheSize] Deprecated.  Use the cacheSize option on the layer instead.
 * @property {import("../proj.js").ProjectionLike} [projection] Projection.
 * @property {import("./Source.js").State} [state] State.
 * @property {import("../tilegrid/TileGrid.js").default} [tileGrid] TileGrid.
 * @property {import("../Tile.js").LoadFunction} tileLoadFunction TileLoadFunction.
 * @property {number} [tilePixelRatio] TilePixelRatio.
 * @property {import("../Tile.js").UrlFunction} [tileUrlFunction] Deprecated.  Use an ImageTile source and provide a function
 * for the url option instead.
 * @property {string} [url] Url.
 * @property {Array<string>} [urls] Urls.
 * @property {boolean} [wrapX=true] WrapX.
 * @property {number} [transition] Transition.
 * @property {string} [key] Key.
 * @property {number|import("../array.js").NearestDirectionFunction} [zDirection=0] ZDirection.
 * @property {boolean} [interpolate=false] Use interpolated values when resampling.  By default,
 * the nearest neighbor is used when resampling.
 */
/**
 * @deprecated Use the ol/source/ImageTile.js instead.
 *
 * @fires import("./Tile.js").TileSourceEvent
 */
declare class UrlTile extends TileSource<Tile> {
    /**
     * @param {Options} options Image tile options.
     */
    constructor(options: Options$h);
    /**
     * @private
     * @type {boolean}
     */
    private generateTileUrlFunction_;
    /**
     * @protected
     * @type {import("../Tile.js").LoadFunction}
     */
    protected tileLoadFunction: LoadFunction;
    /**
     * @param {import("../tilecoord.js").TileCoord} tileCoord Tile coordinate.
     * @param {number} pixelRatio Pixel ratio.
     * @param {import("../proj/Projection.js").default} projection Projection.
     * @return {string|undefined} Tile URL.
     */
    tileUrlFunction(tileCoord: TileCoord, pixelRatio: number, projection: Projection): string | undefined;
    /**
     * @protected
     * @type {!Array<string>|null}
     */
    protected urls: Array<string> | null;
    /**
     * @private
     * @type {!Object<string, boolean>}
     */
    private tileLoadingKeys_;
    /**
     * Deprecated.  Use an ImageTile source instead.
     * Return the tile load function of the source.
     * @return {import("../Tile.js").LoadFunction} TileLoadFunction
     * @api
     */
    getTileLoadFunction(): LoadFunction;
    /**
     * Deprecated.  Use an ImageTile source instead.
     * Return the tile URL function of the source.
     * @return {import("../Tile.js").UrlFunction} TileUrlFunction
     * @api
     */
    getTileUrlFunction(): UrlFunction;
    /**
     * Deprecated.  Use an ImageTile source instead.
     * Return the URLs used for this source.
     * When a tileUrlFunction is used instead of url or urls,
     * null will be returned.
     * @return {!Array<string>|null} URLs.
     * @api
     */
    getUrls(): Array<string> | null;
    /**
     * Handle tile change events.
     * @param {import("../events/Event.js").default} event Event.
     * @protected
     */
    protected handleTileChange(event: BaseEvent): void;
    /**
     * Deprecated.  Use an ImageTile source instead.
     * Set the tile load function of the source.
     * @param {import("../Tile.js").LoadFunction} tileLoadFunction Tile load function.
     * @api
     */
    setTileLoadFunction(tileLoadFunction: LoadFunction): void;
    /**
     * Deprecated.  Use an ImageTile source instead.
     * Set the tile URL function of the source.
     * @param {import("../Tile.js").UrlFunction} tileUrlFunction Tile URL function.
     * @param {string} [key] Optional new tile key for the source.
     * @api
     */
    setTileUrlFunction(tileUrlFunction: UrlFunction, key?: string): void;
    /**
     * Set the URL to use for requests.
     * @param {string} url URL.
     * @api
     */
    setUrl(url: string): void;
    /**
     * Deprecated.  Use an ImageTile source instead.
     * Set the URLs to use for requests.
     * @param {Array<string>} urls URLs.
     * @api
     */
    setUrls(urls: Array<string>): void;
}

type FunctionType = (arg0: number, arg1: number, arg2: number, arg3: number) => (ImageTile);
/**
 * @typedef {function(number, number, number, number) : (import("../ImageTile.js").default)} FunctionType
 */
/**
 * @typedef {Object} TileOffset
 * @property {import("../ImageTile.js").default} tile Tile.
 * @property {number} offset Offset.
 */
/**
 * @classdesc
 * Class encapsulating single reprojected tile.
 * See {@link module:ol/source/TileImage~TileImage}.
 *
 */
declare class ReprojTile extends Tile {
    /**
     * @param {import("../proj/Projection.js").default} sourceProj Source projection.
     * @param {import("../tilegrid/TileGrid.js").default} sourceTileGrid Source tile grid.
     * @param {import("../proj/Projection.js").default} targetProj Target projection.
     * @param {import("../tilegrid/TileGrid.js").default} targetTileGrid Target tile grid.
     * @param {import("../tilecoord.js").TileCoord} tileCoord Coordinate of the tile.
     * @param {import("../tilecoord.js").TileCoord} wrappedTileCoord Coordinate of the tile wrapped in X.
     * @param {number} pixelRatio Pixel ratio.
     * @param {number} gutter Gutter of the source tiles.
     * @param {FunctionType} getTileFunction
     *     Function returning source tiles (z, x, y, pixelRatio).
     * @param {number} [errorThreshold] Acceptable reprojection error (in px).
     * @param {boolean} [renderEdges] Render reprojection edges.
     * @param {import("../Tile.js").Options} [options] Tile options.
     */
    constructor(sourceProj: Projection, sourceTileGrid: TileGrid, targetProj: Projection, targetTileGrid: TileGrid, tileCoord: TileCoord, wrappedTileCoord: TileCoord, pixelRatio: number, gutter: number, getTileFunction: FunctionType, errorThreshold?: number, renderEdges?: boolean, options?: Options$D);
    /**
     * @private
     * @type {boolean}
     */
    private renderEdges_;
    /**
     * @private
     * @type {number}
     */
    private pixelRatio_;
    /**
     * @private
     * @type {number}
     */
    private gutter_;
    /**
     * @private
     * @type {HTMLCanvasElement|OffscreenCanvas}
     */
    private canvas_;
    /**
     * @private
     * @type {import("../tilegrid/TileGrid.js").default}
     */
    private sourceTileGrid_;
    /**
     * @private
     * @type {import("../tilegrid/TileGrid.js").default}
     */
    private targetTileGrid_;
    /**
     * @private
     * @type {import("../tilecoord.js").TileCoord}
     */
    private wrappedTileCoord_;
    /**
     * @private
     * @type {!Array<TileOffset>}
     */
    private sourceTiles_;
    /**
     * @private
     * @type {?Array<import("../events.js").EventsKey>}
     */
    private sourcesListenerKeys_;
    /**
     * @private
     * @type {number}
     */
    private sourceZ_;
    /**
     * @private
     * @type {import("../extent.js").Extent}
     */
    private clipExtent_;
    /**
     * @private
     * @type {!import("./Triangulation.js").default}
     */
    private triangulation_;
    /**
     * Get the HTML Canvas element for this tile.
     * @return {HTMLCanvasElement|OffscreenCanvas} Canvas.
     */
    getImage(): HTMLCanvasElement | OffscreenCanvas;
    /**
     * @private
     */
    private reproject_;
    /**
     * @private
     */
    private unlistenSources_;
}

type CrossOriginAttribute = "anonymous" | "use-credentials";
type LoaderOptions = {
    /**
     * An abort controller signal.
     */
    signal: AbortSignal;
    /**
     * The cross-origin attribute for images.
     */
    crossOrigin?: CrossOriginAttribute | undefined;
    /**
     * The maximum y coordinate at the given z level.  Will be undefined if the
     * underlying tile grid does not have a known extent.
     */
    maxY?: number | undefined;
};
/**
 * Data tile loading function.  The function is called with z, x, and y tile coordinates and
 * returns {@link import ("../DataTile.js").Data data} for a tile or a promise for the same.
 */
type Loader$1 = (arg0: number, arg1: number, arg2: number, arg3: LoaderOptions) => (Data | Promise<Data>);
type Options$g = {
    /**
     * Data loader.  Called with z, x, and y tile coordinates.
     * Returns {@link import ("../DataTile.js").Data data} for a tile or a promise for the same.
     * For loaders that generate images, the promise should not resolve until the image is loaded.
     */
    loader?: Loader$1 | undefined;
    /**
     * Attributions.
     */
    attributions?: AttributionLike | undefined;
    /**
     * Attributions are collapsible.
     */
    attributionsCollapsible?: boolean | undefined;
    /**
     * Optional max zoom level. Not used if `tileGrid` is provided.
     */
    maxZoom?: number | undefined;
    /**
     * Optional min zoom level. Not used if `tileGrid` is provided.
     */
    minZoom?: number | undefined;
    /**
     * The pixel width and height of the source tiles.
     * This may be different than the rendered pixel size if a `tileGrid` is provided.
     */
    tileSize?: number | Size | undefined;
    /**
     * The size in pixels of the gutter around data tiles to ignore.
     * This allows artifacts of rendering at tile edges to be ignored.
     * Supported data should be wider and taller than the tile size by a value of `2 x gutter`.
     */
    gutter?: number | undefined;
    /**
     * Optional tile grid resolution at level zero. Not used if `tileGrid` is provided.
     */
    maxResolution?: number | undefined;
    /**
     * Tile projection.
     */
    projection?: ProjectionLike;
    /**
     * Tile grid.
     */
    tileGrid?: TileGrid | undefined;
    /**
     * The source state.
     */
    state?: State | undefined;
    /**
     * Render tiles beyond the antimeridian.
     */
    wrapX?: boolean | undefined;
    /**
     * Transition time when fading in new tiles (in milliseconds).
     */
    transition?: number | undefined;
    /**
     * Number of bands represented in the data.
     */
    bandCount?: number | undefined;
    /**
     * Use interpolated values when resampling.  By default,
     * the nearest neighbor is used when resampling.
     */
    interpolate?: boolean | undefined;
    /**
     * The crossOrigin property to pass to loaders for image data.
     */
    crossOrigin?: CrossOriginAttribute | undefined;
    /**
     * Key for use in caching tiles.
     */
    key?: string | undefined;
    /**
     * Choose whether to use tiles with a higher or lower zoom level when between integer
     * zoom levels. See {@link module :ol/tilegrid/TileGrid~TileGrid#getZForResolution}.
     */
    zDirection?: number | NearestDirectionFunction | undefined;
};
/**
 * @typedef {'anonymous'|'use-credentials'} CrossOriginAttribute
 */
/**
 * @typedef {Object} LoaderOptions
 * @property {AbortSignal} signal An abort controller signal.
 * @property {CrossOriginAttribute} [crossOrigin] The cross-origin attribute for images.
 * @property {number} [maxY] The maximum y coordinate at the given z level.  Will be undefined if the
 * underlying tile grid does not have a known extent.
 */
/**
 * Data tile loading function.  The function is called with z, x, and y tile coordinates and
 * returns {@link import("../DataTile.js").Data data} for a tile or a promise for the same.
 * @typedef {function(number, number, number, LoaderOptions) : (import("../DataTile.js").Data|Promise<import("../DataTile.js").Data>)} Loader
 */
/**
 * @typedef {Object} Options
 * @property {Loader} [loader] Data loader.  Called with z, x, and y tile coordinates.
 * Returns {@link import("../DataTile.js").Data data} for a tile or a promise for the same.
 * For loaders that generate images, the promise should not resolve until the image is loaded.
 * @property {import("./Source.js").AttributionLike} [attributions] Attributions.
 * @property {boolean} [attributionsCollapsible=true] Attributions are collapsible.
 * @property {number} [maxZoom=42] Optional max zoom level. Not used if `tileGrid` is provided.
 * @property {number} [minZoom=0] Optional min zoom level. Not used if `tileGrid` is provided.
 * @property {number|import("../size.js").Size} [tileSize=[256, 256]] The pixel width and height of the source tiles.
 * This may be different than the rendered pixel size if a `tileGrid` is provided.
 * @property {number} [gutter=0] The size in pixels of the gutter around data tiles to ignore.
 * This allows artifacts of rendering at tile edges to be ignored.
 * Supported data should be wider and taller than the tile size by a value of `2 x gutter`.
 * @property {number} [maxResolution] Optional tile grid resolution at level zero. Not used if `tileGrid` is provided.
 * @property {import("../proj.js").ProjectionLike} [projection='EPSG:3857'] Tile projection.
 * @property {import("../tilegrid/TileGrid.js").default} [tileGrid] Tile grid.
 * @property {import("./Source.js").State} [state] The source state.
 * @property {boolean} [wrapX=false] Render tiles beyond the antimeridian.
 * @property {number} [transition] Transition time when fading in new tiles (in milliseconds).
 * @property {number} [bandCount=4] Number of bands represented in the data.
 * @property {boolean} [interpolate=false] Use interpolated values when resampling.  By default,
 * the nearest neighbor is used when resampling.
 * @property {CrossOriginAttribute} [crossOrigin='anonymous'] The crossOrigin property to pass to loaders for image data.
 * @property {string} [key] Key for use in caching tiles.
 * @property {number|import("../array.js").NearestDirectionFunction} [zDirection=0]
 * Choose whether to use tiles with a higher or lower zoom level when between integer
 * zoom levels. See {@link module:ol/tilegrid/TileGrid~TileGrid#getZForResolution}.
 */
/**
 * @classdesc
 * A source for typed array data tiles.
 *
 * @fires import("./Tile.js").TileSourceEvent
 * @template {import("../Tile.js").default} [TileType=DataTile]
 * @extends TileSource<TileType>
 * @api
 */
declare class DataTileSource<TileType extends Tile = DataTile> extends TileSource<TileType> {
    /**
     * @param {Options} options DataTile source options.
     */
    constructor(options: Options$g);
    /**
     * @private
     * @type {number}
     */
    private gutter_;
    /**
     * @private
     * @type {import('../size.js').Size|null}
     */
    private tileSize_;
    /**
     * @private
     * @type {Array<import('../size.js').Size>|null}
     */
    private tileSizes_;
    /**
     * @private
     * @type {!Object<string, boolean>}
     */
    private tileLoadingKeys_;
    /**
     * @private
     */
    private loader_;
    /**
     * Handle tile change events.
     * @param {import("../events/Event.js").default} event Event.
     */
    handleTileChange_(event: BaseEvent): void;
    /**
     * @type {number}
     */
    bandCount: number;
    /**
     * @private
     * @type {!Object<string, import("../tilegrid/TileGrid.js").default>}
     */
    private tileGridForProjection_;
    /**
     * @private
     * @type {CrossOriginAttribute}
     */
    private crossOrigin_;
    /**
     * @type {import("../transform.js").Transform|null}
     */
    transformMatrix: Transform | null;
    /**
     * Set the source tile sizes.  The length of the array is expected to match the number of
     * levels in the tile grid.
     * @protected
     * @param {Array<import('../size.js').Size>} tileSizes An array of tile sizes.
     */
    protected setTileSizes(tileSizes: Array<Size>): void;
    /**
     * Get the source tile size at the given zoom level.  This may be different than the rendered tile
     * size.
     * @protected
     * @param {number} z Tile zoom level.
     * @return {import('../size.js').Size} The source tile size.
     */
    protected getTileSize(z: number): Size;
    /**
     * @param {Loader} loader The data loader.
     * @protected
     */
    protected setLoader(loader: Loader$1): void;
    /**
     * @param {number} z Tile coordinate z.
     * @param {number} x Tile coordinate x.
     * @param {number} y Tile coordinate y.
     * @param {import("../proj/Projection.js").default} targetProj The output projection.
     * @param {import("../proj/Projection.js").default} sourceProj The input projection.
     * @param {import("../structs/LRUCache.js").default<import("../Tile.js").default>} [tileCache] Tile cache.
     * @return {!TileType} Tile.
     */
    getReprojTile_(z: number, x: number, y: number, targetProj: Projection, sourceProj: Projection, tileCache?: LRUCache<Tile>): TileType;
    /**
     * @param {number} z Tile coordinate z.
     * @param {number} x Tile coordinate x.
     * @param {number} y Tile coordinate y.
     * @param {number} pixelRatio Pixel ratio.
     * @param {import("../proj/Projection.js").default} [projection] Projection.
     * @param {import("../structs/LRUCache.js").default<import("../Tile.js").default>} [tileCache] Tile cache.
     * @return {TileType|null} Tile (or null if outside source extent).
     * @override
     */
    override getTile(z: number, x: number, y: number, pixelRatio: number, projection?: Projection, tileCache?: LRUCache<Tile>): TileType | null;
    /**
     * Sets the tile grid to use when reprojecting the tiles to the given
     * projection instead of the default tile grid for the projection.
     *
     * This can be useful when the default tile grid cannot be created
     * (e.g. projection has no extent defined) or
     * for optimization reasons (custom tile size, resolutions, ...).
     *
     * @param {import("../proj.js").ProjectionLike} projection Projection.
     * @param {import("../tilegrid/TileGrid.js").default} tilegrid Tile grid to use for the projection.
     * @api
     */
    setTileGridForProjection(projection: ProjectionLike, tilegrid: TileGrid): void;
}

/**
 * A function that is called to trigger asynchronous canvas drawing.  It is
 * called with a "done" callback that should be called when drawing is done.
 * If any error occurs during drawing, the "done" callback should be called with
 * that error.
 */
type Loader = (arg0: (arg0: Error | undefined) => void) => void;
/**
 * A function that is called to trigger asynchronous canvas drawing.  It is
 * called with a "done" callback that should be called when drawing is done.
 * If any error occurs during drawing, the "done" callback should be called with
 * that error.
 *
 * @typedef {function(function(Error=): void): void} Loader
 */
declare class ImageCanvas extends ImageWrapper {
    /**
     * @param {import("./extent.js").Extent} extent Extent.
     * @param {number} resolution Resolution.
     * @param {number} pixelRatio Pixel ratio.
     * @param {HTMLCanvasElement|OffscreenCanvas} canvas Canvas.
     * @param {Loader} [loader] Optional loader function to
     *     support asynchronous canvas drawing.
     */
    constructor(extent: Extent, resolution: number, pixelRatio: number, canvas: HTMLCanvasElement | OffscreenCanvas, loader?: Loader);
    /**
     * Optional canvas loader function.
     * @type {?Loader}
     * @private
     */
    private loader_;
    /**
     * @private
     * @type {HTMLCanvasElement|OffscreenCanvas}
     */
    private canvas_;
    /**
     * @private
     * @type {?Error}
     */
    private error_;
    /**
     * Get any error associated with asynchronous rendering.
     * @return {?Error} Any error that occurred during rendering.
     */
    getError(): Error | null;
    /**
     * Handle async drawing complete.
     * @param {Error} [err] Any error during drawing.
     * @private
     */
    private handleLoad_;
    /**
     * @return {HTMLCanvasElement|OffscreenCanvas} Canvas element.
     * @override
     */
    override getImage(): HTMLCanvasElement | OffscreenCanvas;
}

type Options$f<FeatureType extends FeatureLike = RenderFeature> = {
    /**
     * Attributions.
     */
    attributions?: AttributionLike | undefined;
    /**
     * Attributions are collapsible.
     */
    attributionsCollapsible?: boolean | undefined;
    /**
     * Initial tile cache size. Will auto-grow to hold at least twice the number of tiles in the viewport.
     */
    cacheSize?: number | undefined;
    /**
     * Extent.
     */
    extent?: Extent | undefined;
    /**
     * Feature format for tiles. Used and required by the default.
     */
    format?: FeatureFormat<FeatureType> | undefined;
    /**
     * This source may have overlapping geometries. Setting this
     * to `false` (e.g. for sources with polygons that represent administrative
     * boundaries or TopoJSON sources) allows the renderer to optimise fill and
     * stroke operations.
     */
    overlaps?: boolean | undefined;
    /**
     * Projection of the tile source.
     */
    projection?: ProjectionLike;
    /**
     * Source state.
     */
    state?: State | undefined;
    /**
     * Class used to instantiate tiles.
     * Default is {@link module :ol/VectorTile~VectorTile}.
     */
    tileClass?: typeof VectorTile$1 | undefined;
    /**
     * Optional max zoom level. Not used if `tileGrid` is provided.
     */
    maxZoom?: number | undefined;
    /**
     * Optional min zoom level. Not used if `tileGrid` is provided.
     */
    minZoom?: number | undefined;
    /**
     * Optional tile size. Not used if `tileGrid` is provided.
     */
    tileSize?: number | Size | undefined;
    /**
     * Optional tile grid resolution at level zero. Not used if `tileGrid` is provided.
     */
    maxResolution?: number | undefined;
    /**
     * Tile grid.
     */
    tileGrid?: TileGrid | undefined;
    /**
     * Optional function to load a tile given a URL. Could look like this for pbf tiles:
     * ```js
     * function(tile, url) {
     * tile.setLoader(function(extent, resolution, projection) {
     * fetch(url).then(function(response) {
     * response.arrayBuffer().then(function(data) {
     * const format = tile.getFormat() // ol/format/MVT configured as source format
     * const features = format.readFeatures(data, {
     * extent: extent,
     * featureProjection: projection
     * });
     * tile.setFeatures(features);
     * });
     * });
     * });
     * }
     * ```
     * If you do not need extent, resolution and projection to get the features for a tile (e.g.
     * for GeoJSON tiles), your `tileLoadFunction` does not need a `setLoader()` call. Only make sure
     * to call `setFeatures()` on the tile:
     * ```js
     * const format = new GeoJSON({featureProjection: map.getView().getProjection()});
     * async function tileLoadFunction(tile, url) {
     * const response = await fetch(url);
     * const data = await response.json();
     * tile.setFeatures(format.readFeatures(data));
     * }
     * ```
     */
    tileLoadFunction?: LoadFunction | undefined;
    /**
     * Optional function to get tile URL given a tile coordinate and the projection.
     */
    tileUrlFunction?: UrlFunction | undefined;
    /**
     * URL template. Must include `{x}`, `{y}` or `{-y}`, and `{z}` placeholders.
     * A `{?-?}` template pattern, for example `subdomain{a-f}.domain.com`, may be
     * used instead of defining each one separately in the `urls` option.
     */
    url?: string | undefined;
    /**
     * A duration for tile opacity
     * transitions in milliseconds. A duration of 0 disables the opacity transition.
     */
    transition?: number | undefined;
    /**
     * An array of URL templates.
     */
    urls?: string[] | undefined;
    /**
     * Whether to wrap the world horizontally.
     * When set to `false`, only one world
     * will be rendered. When set to `true`, tiles will be wrapped horizontally to
     * render multiple worlds.
     */
    wrapX?: boolean | undefined;
    /**
     * Choose whether to use tiles with a higher or lower zoom level when between integer
     * zoom levels. See {@link module :ol/tilegrid/TileGrid~TileGrid#getZForResolution}.
     */
    zDirection?: number | NearestDirectionFunction | undefined;
};
/**
 * @template {import("../Feature.js").FeatureLike} [FeatureType=import("../render/Feature.js").default]
 * @typedef {Object} Options
 * @property {import("./Source.js").AttributionLike} [attributions] Attributions.
 * @property {boolean} [attributionsCollapsible=true] Attributions are collapsible.
 * @property {number} [cacheSize] Initial tile cache size. Will auto-grow to hold at least twice the number of tiles in the viewport.
 * @property {import("../extent.js").Extent} [extent] Extent.
 * @property {import("../format/Feature.js").default<FeatureType>} [format] Feature format for tiles. Used and required by the default.
 * @property {boolean} [overlaps=true] This source may have overlapping geometries. Setting this
 * to `false` (e.g. for sources with polygons that represent administrative
 * boundaries or TopoJSON sources) allows the renderer to optimise fill and
 * stroke operations.
 * @property {import("../proj.js").ProjectionLike} [projection='EPSG:3857'] Projection of the tile source.
 * @property {import("./Source.js").State} [state] Source state.
 * @property {typeof import("../VectorTile.js").default} [tileClass] Class used to instantiate tiles.
 * Default is {@link module:ol/VectorTile~VectorTile}.
 * @property {number} [maxZoom=22] Optional max zoom level. Not used if `tileGrid` is provided.
 * @property {number} [minZoom] Optional min zoom level. Not used if `tileGrid` is provided.
 * @property {number|import("../size.js").Size} [tileSize=512] Optional tile size. Not used if `tileGrid` is provided.
 * @property {number} [maxResolution] Optional tile grid resolution at level zero. Not used if `tileGrid` is provided.
 * @property {import("../tilegrid/TileGrid.js").default} [tileGrid] Tile grid.
 * @property {import("../Tile.js").LoadFunction} [tileLoadFunction]
 * Optional function to load a tile given a URL. Could look like this for pbf tiles:
 * ```js
 * function(tile, url) {
 *   tile.setLoader(function(extent, resolution, projection) {
 *     fetch(url).then(function(response) {
 *       response.arrayBuffer().then(function(data) {
 *         const format = tile.getFormat() // ol/format/MVT configured as source format
 *         const features = format.readFeatures(data, {
 *           extent: extent,
 *           featureProjection: projection
 *         });
 *         tile.setFeatures(features);
 *       });
 *     });
 *   });
 * }
 * ```
 * If you do not need extent, resolution and projection to get the features for a tile (e.g.
 * for GeoJSON tiles), your `tileLoadFunction` does not need a `setLoader()` call. Only make sure
 * to call `setFeatures()` on the tile:
 * ```js
 * const format = new GeoJSON({featureProjection: map.getView().getProjection()});
 * async function tileLoadFunction(tile, url) {
 *   const response = await fetch(url);
 *   const data = await response.json();
 *   tile.setFeatures(format.readFeatures(data));
 * }
 * ```
 * @property {import("../Tile.js").UrlFunction} [tileUrlFunction] Optional function to get tile URL given a tile coordinate and the projection.
 * @property {string} [url] URL template. Must include `{x}`, `{y}` or `{-y}`, and `{z}` placeholders.
 * A `{?-?}` template pattern, for example `subdomain{a-f}.domain.com`, may be
 * used instead of defining each one separately in the `urls` option.
 * @property {number} [transition] A duration for tile opacity
 * transitions in milliseconds. A duration of 0 disables the opacity transition.
 * @property {Array<string>} [urls] An array of URL templates.
 * @property {boolean} [wrapX=true] Whether to wrap the world horizontally.
 * When set to `false`, only one world
 * will be rendered. When set to `true`, tiles will be wrapped horizontally to
 * render multiple worlds.
 * @property {number|import("../array.js").NearestDirectionFunction} [zDirection=1]
 * Choose whether to use tiles with a higher or lower zoom level when between integer
 * zoom levels. See {@link module:ol/tilegrid/TileGrid~TileGrid#getZForResolution}.
 */
/**
 * @classdesc
 * Class for layer sources providing vector data divided into a tile grid, to be
 * used with {@link module:ol/layer/VectorTile~VectorTileLayer}. Although this source receives tiles
 * with vector features from the server, it is not meant for feature editing.
 * Features are optimized for rendering, their geometries are clipped at or near
 * tile boundaries and simplified for a view resolution. See
 * {@link module:ol/source/Vector~VectorSource} for vector sources that are suitable for feature
 * editing.
 *
 * @fires import("./Tile.js").TileSourceEvent
 * @api
 * @template {import("../Feature.js").FeatureLike} [FeatureType=import("../render/Feature.js").default]
 */
declare class VectorTile<FeatureType extends FeatureLike = RenderFeature> extends UrlTile {
    /**
     * @param {!Options<FeatureType>} options Vector tile options.
     */
    constructor(options: Options$f<FeatureType>);
    /**
     * @private
     * @type {import("../format/Feature.js").default<FeatureType>|null}
     */
    private format_;
    /**
     * @type {Object<string, Array<string>>}
     * @private
     */
    private tileKeysBySourceTileUrl_;
    /**
     @type {Object<string, Tile<FeatureType>>}
     */
    sourceTiles_: {
        [x: string]: VectorTile$1<FeatureType>;
    };
    /**
     * @private
     * @type {boolean}
     */
    private overlaps_;
    /**
     * @protected
     * @type {typeof import("../VectorTile.js").default}
     */
    protected tileClass: typeof VectorTile$1;
    /**
     * @private
     * @type {Object<string, import("../tilegrid/TileGrid.js").default>}
     */
    private tileGrids_;
    /**
     * @return {boolean} The source can have overlapping geometries.
     */
    getOverlaps(): boolean;
    /**
     * @param {number} pixelRatio Pixel ratio.
     * @param {import("../proj/Projection").default} projection Projection.
     * @param {VectorRenderTile} tile Vector render tile.
     * @return {Array<import("../VectorTile").default>} Tile keys.
     */
    getSourceTiles(pixelRatio: number, projection: Projection, tile: VectorRenderTile): Array<VectorTile$1<any>>;
    /**
     * @param {VectorRenderTile} tile Vector render tile.
     */
    removeSourceTiles(tile: VectorRenderTile): void;
    /**
     * @param {number} z Tile coordinate z.
     * @param {number} x Tile coordinate x.
     * @param {number} y Tile coordinate y.
     * @param {number} pixelRatio Pixel ratio.
     * @param {import("../proj/Projection.js").default} projection Projection.
     * @return {!VectorRenderTile} Tile.
     * @override
     */
    override getTile(z: number, x: number, y: number, pixelRatio: number, projection: Projection): VectorRenderTile;
    /**
     * @param {boolean} overlaps The source has overlapping geometries.
     */
    setOverlaps(overlaps: boolean): void;
}

/**
 * *
 */
type VectorTileLayerOnSignature<Return> = OnSignature<EventTypes, BaseEvent, Return> & OnSignature<BaseLayerObjectEventTypes | LayerEventType | "change:preload" | "change:useInterimTilesOnError", ObjectEvent, Return> & OnSignature<LayerRenderEventTypes, RenderEvent, Return> & CombinedOnSignature<EventTypes | BaseLayerObjectEventTypes | LayerEventType | "change:preload" | "change:useInterimTilesOnError" | LayerRenderEventTypes, Return>;
type VectorTileRenderType = "hybrid" | "vector";
/**
 * *
 */
type ExtractedFeatureType$2<T> = T extends VectorTile<infer U extends FeatureLike> ? U : never;
type Options$e<VectorTileSourceType extends VectorTile<FeatureType> = VectorTile<any>, FeatureType extends FeatureLike = ExtractedFeatureType$2<VectorTileSourceType>> = {
    /**
     * A CSS class name to set to the layer element.
     */
    className?: string | undefined;
    /**
     * Opacity (0, 1).
     */
    opacity?: number | undefined;
    /**
     * Visibility.
     */
    visible?: boolean | undefined;
    /**
     * The bounding extent for layer rendering.  The layer will not be
     * rendered outside of this extent.
     */
    extent?: Extent | undefined;
    /**
     * The z-index for layer rendering.  At rendering time, the layers
     * will be ordered, first by Z-index and then by position. When `undefined`, a `zIndex` of 0 is assumed
     * for layers that are added to the map's `layers` collection, or `Infinity` when the layer's `setMap()`
     * method was used.
     */
    zIndex?: number | undefined;
    /**
     * The minimum resolution (inclusive) at which this layer will be
     * visible.
     */
    minResolution?: number | undefined;
    /**
     * The maximum resolution (exclusive) below which this layer will
     * be visible.
     */
    maxResolution?: number | undefined;
    /**
     * The minimum view zoom level (exclusive) above which this layer will be
     * visible.
     */
    minZoom?: number | undefined;
    /**
     * The maximum view zoom level (inclusive) at which this layer will
     * be visible.
     */
    maxZoom?: number | undefined;
    /**
     * Render order. Function to be used when sorting
     * features before rendering. By default features are drawn in the order that they are created. Use
     * `null` to avoid the sort, but get an undefined draw order.
     */
    renderOrder?: OrderFunction | undefined;
    /**
     * The buffer in pixels around the tile extent used by the
     * renderer when getting features from the vector tile for the rendering or hit-detection.
     * Recommended value: Vector tiles are usually generated with a buffer, so this value should match
     * the largest possible buffer of the used tiles. It should be at least the size of the largest
     * point symbol or line width.
     */
    renderBuffer?: number | undefined;
    /**
     * Render mode for vector tiles:
     * `'hybrid'`: Polygon and line elements are rendered as images, so pixels are scaled during zoom
     * animations. Point symbols and texts are accurately rendered as vectors and can stay upright on
     * rotated views, but get lifted above all polygon and line elements.
     * `'vector'`: Everything is rendered as vectors and the original render order is maintained. Use
     * this mode for improved performance and visual epxerience on vector tile layers with not too many
     * rendered features (e.g. for highlighting a subset of features of another layer with the same
     * source).
     */
    renderMode?: VectorTileRenderType | undefined;
    /**
     * Source.
     */
    source?: VectorTileSourceType | undefined;
    /**
     * Sets the layer as overlay on a map. The map will not manage
     * this layer in its layers collection, and the layer will be rendered on top. This is useful for
     * temporary layers. The standard way to add a layer to a map and have it managed by the map is to
     * use [map.addLayer()]{@link import ("../Map.js").default#addLayer}.
     */
    map?: Map | undefined;
    /**
     * Declutter images and text. Any truthy value will enable
     * decluttering. Within a layer, a feature rendered before another has higher priority. All layers with the
     * same `declutter` value will be decluttered together. The priority is determined by the drawing order of the
     * layers with the same `declutter` value. Higher in the layer stack means higher priority. To declutter distinct
     * layers or groups of layers separately, use different truthy values for `declutter`.
     */
    declutter?: string | number | boolean | undefined;
    /**
     * Layer
     * style. When set to `null`, only
     * features that have their own style will be rendered. See {@link module :ol/style/Style~Style} for the default style
     * which will be used if this is not set.
     */
    style?: StyleLike | FlatStyleLike$1 | null | undefined;
    /**
     * Background color for the layer. If not specified, no
     * background will be rendered.
     */
    background?: BackgroundColor | undefined;
    /**
     * When set to `true`, feature batches will be
     * recreated during animations. This means that no vectors will be shown clipped, but the setting
     * will have a performance impact for large amounts of vector data. When set to `false`, batches
     * will be recreated when no animation is active.
     */
    updateWhileAnimating?: boolean | undefined;
    /**
     * When set to `true`, feature batches will be
     * recreated during interactions. See also `updateWhileAnimating`.
     */
    updateWhileInteracting?: boolean | undefined;
    /**
     * Preload. Load low-resolution tiles up to `preload` levels. `0`
     * means no preloading.
     */
    preload?: number | undefined;
    /**
     * Deprecated.  Use interim tiles on error.
     */
    useInterimTilesOnError?: boolean | undefined;
    /**
     * Arbitrary observable properties. Can be accessed with `#get()` and `#set()`.
     */
    properties?: {
        [x: string]: any;
    } | undefined;
    /**
     * The internal tile cache size.  If too small, this will auto-grow to hold
     * two zoom levels worth of tiles.
     */
    cacheSize?: number | undefined;
};
/***
 * @template Return
 * @typedef {import("../Observable").OnSignature<import("../Observable").EventTypes, import("../events/Event.js").default, Return> &
 *   import("../Observable").OnSignature<import("./Base").BaseLayerObjectEventTypes|
 *     import("./Layer.js").LayerEventType|'change:preload'|'change:useInterimTilesOnError', import("../Object").ObjectEvent, Return> &
 *   import("../Observable").OnSignature<import("../render/EventType").LayerRenderEventTypes, import("../render/Event").default, Return> &
 *   import("../Observable").CombinedOnSignature<import("../Observable").EventTypes|import("./Base").BaseLayerObjectEventTypes|
 *     import("./Layer.js").LayerEventType|'change:preload'|'change:useInterimTilesOnError'|import("../render/EventType").LayerRenderEventTypes, Return>} VectorTileLayerOnSignature
 */
/**
 * @typedef {'hybrid' | 'vector'} VectorTileRenderType
 */
/***
 * @template T
 * @typedef {T extends import("../source/VectorTile.js").default<infer U extends import("../Feature.js").FeatureLike> ? U : never} ExtractedFeatureType
 */
/**
 * @template {import("../source/VectorTile.js").default<FeatureType>} [VectorTileSourceType=import("../source/VectorTile.js").default<*>]
 * @template {import("../Feature").FeatureLike} [FeatureType=ExtractedFeatureType<VectorTileSourceType>]
 * @typedef {Object} Options
 * @property {string} [className='ol-layer'] A CSS class name to set to the layer element.
 * @property {number} [opacity=1] Opacity (0, 1).
 * @property {boolean} [visible=true] Visibility.
 * @property {import("../extent.js").Extent} [extent] The bounding extent for layer rendering.  The layer will not be
 * rendered outside of this extent.
 * @property {number} [zIndex] The z-index for layer rendering.  At rendering time, the layers
 * will be ordered, first by Z-index and then by position. When `undefined`, a `zIndex` of 0 is assumed
 * for layers that are added to the map's `layers` collection, or `Infinity` when the layer's `setMap()`
 * method was used.
 * @property {number} [minResolution] The minimum resolution (inclusive) at which this layer will be
 * visible.
 * @property {number} [maxResolution] The maximum resolution (exclusive) below which this layer will
 * be visible.
 * @property {number} [minZoom] The minimum view zoom level (exclusive) above which this layer will be
 * visible.
 * @property {number} [maxZoom] The maximum view zoom level (inclusive) at which this layer will
 * be visible.
 * @property {import("../render.js").OrderFunction} [renderOrder] Render order. Function to be used when sorting
 * features before rendering. By default features are drawn in the order that they are created. Use
 * `null` to avoid the sort, but get an undefined draw order.
 * @property {number} [renderBuffer=100] The buffer in pixels around the tile extent used by the
 * renderer when getting features from the vector tile for the rendering or hit-detection.
 * Recommended value: Vector tiles are usually generated with a buffer, so this value should match
 * the largest possible buffer of the used tiles. It should be at least the size of the largest
 * point symbol or line width.
 * @property {VectorTileRenderType} [renderMode='hybrid'] Render mode for vector tiles:
 *  `'hybrid'`: Polygon and line elements are rendered as images, so pixels are scaled during zoom
 *    animations. Point symbols and texts are accurately rendered as vectors and can stay upright on
 *    rotated views, but get lifted above all polygon and line elements.
 *  `'vector'`: Everything is rendered as vectors and the original render order is maintained. Use
 *    this mode for improved performance and visual epxerience on vector tile layers with not too many
 *    rendered features (e.g. for highlighting a subset of features of another layer with the same
 *    source).
 * @property {VectorTileSourceType} [source] Source.
 * @property {import("../Map.js").default} [map] Sets the layer as overlay on a map. The map will not manage
 * this layer in its layers collection, and the layer will be rendered on top. This is useful for
 * temporary layers. The standard way to add a layer to a map and have it managed by the map is to
 * use [map.addLayer()]{@link import("../Map.js").default#addLayer}.
 * @property {boolean|string|number} [declutter=false] Declutter images and text. Any truthy value will enable
 * decluttering. Within a layer, a feature rendered before another has higher priority. All layers with the
 * same `declutter` value will be decluttered together. The priority is determined by the drawing order of the
 * layers with the same `declutter` value. Higher in the layer stack means higher priority. To declutter distinct
 * layers or groups of layers separately, use different truthy values for `declutter`.
 * @property {import("../style/Style.js").StyleLike|import("../style/flat.js").FlatStyleLike|null} [style] Layer
 * style. When set to `null`, only
 * features that have their own style will be rendered. See {@link module:ol/style/Style~Style} for the default style
 * which will be used if this is not set.
 * @property {import("./Base.js").BackgroundColor} [background] Background color for the layer. If not specified, no
 * background will be rendered.
 * @property {boolean} [updateWhileAnimating=false] When set to `true`, feature batches will be
 * recreated during animations. This means that no vectors will be shown clipped, but the setting
 * will have a performance impact for large amounts of vector data. When set to `false`, batches
 * will be recreated when no animation is active.
 * @property {boolean} [updateWhileInteracting=false] When set to `true`, feature batches will be
 * recreated during interactions. See also `updateWhileAnimating`.
 * @property {number} [preload=0] Preload. Load low-resolution tiles up to `preload` levels. `0`
 * means no preloading.
 * @property {boolean} [useInterimTilesOnError=true] Deprecated.  Use interim tiles on error.
 * @property {Object<string, *>} [properties] Arbitrary observable properties. Can be accessed with `#get()` and `#set()`.
 * @property {number} [cacheSize=0] The internal tile cache size.  If too small, this will auto-grow to hold
 * two zoom levels worth of tiles.
 */
/**
 * @classdesc
 * Layer for vector tile data that is rendered client-side.
 * Note that any property set in the options is set as a {@link module:ol/Object~BaseObject}
 * property on the layer object; for example, setting `title: 'My Title'` in the
 * options means that `title` is observable, and has get/set accessors.
 *
 * @template {import("../source/VectorTile.js").default<FeatureType>} [VectorTileSourceType=import("../source/VectorTile.js").default<*>]
 * @template {import("../Feature.js").FeatureLike} [FeatureType=ExtractedFeatureType<VectorTileSourceType>]
 * @extends {BaseVectorLayer<FeatureType, VectorTileSourceType, CanvasVectorTileLayerRenderer>}
 * @api
 */
declare class VectorTileLayer<VectorTileSourceType extends VectorTile<FeatureType> = VectorTile<any>, FeatureType extends FeatureLike = ExtractedFeatureType$2<VectorTileSourceType>> extends BaseVectorLayer<FeatureType, VectorTileSourceType, CanvasVectorTileLayerRenderer> {
    /**
     * @param {Options<VectorTileSourceType, FeatureType>} [options] Options.
     */
    constructor(options?: Options$e<VectorTileSourceType, FeatureType>);
    /***
     * @type {VectorTileLayerOnSignature<import("../events").EventsKey>}
     */
    on: VectorTileLayerOnSignature<EventsKey>;
    /***
     * @type {VectorTileLayerOnSignature<import("../events").EventsKey>}
     */
    once: VectorTileLayerOnSignature<EventsKey>;
    /***
     * @type {VectorTileLayerOnSignature<void>}
     */
    un: VectorTileLayerOnSignature<void>;
    /**
     * @type {number|undefined}
     * @private
     */
    private cacheSize_;
    /**
     * @private
     * @type {VectorTileRenderType}
     */
    private renderMode_;
    /**
     * Get features whose bounding box intersects the provided extent. Only features for cached
     * tiles for the last rendered zoom level are available in the source. So this method is only
     * suitable for requesting tiles for extents that are currently rendered.
     *
     * Features are returned in random tile order and as they are included in the tiles. This means
     * they can be clipped, duplicated across tiles, and simplified to the render resolution.
     *
     * @param {import("../extent.js").Extent} extent Extent.
     * @return {Array<FeatureType>} Features.
     * @api
     */
    getFeaturesInExtent(extent: Extent): Array<FeatureType>;
    /**
     * @return {VectorTileRenderType} The render mode.
     */
    getRenderMode(): VectorTileRenderType;
    /**
     * Return the level as number to which we will preload tiles up to.
     * @return {number} The level to preload tiles up to.
     * @observable
     * @api
     */
    getPreload(): number;
    /**
     * Deprecated.  Whether we use interim tiles on error.
     * @return {boolean} Use interim tiles on error.
     * @observable
     * @api
     */
    getUseInterimTilesOnError(): boolean;
    /**
     * Set the level as number to which we will preload tiles up to.
     * @param {number} preload The level to preload tiles up to.
     * @observable
     * @api
     */
    setPreload(preload: number): void;
    /**
     * Deprecated.  Set whether we use interim tiles on error.
     * @param {boolean} useInterimTilesOnError Use interim tiles on error.
     * @observable
     * @api
     */
    setUseInterimTilesOnError(useInterimTilesOnError: boolean): void;
}

/**
 * *
 */
type BaseTileLayerOnSignature<Return> = OnSignature<EventTypes, BaseEvent, Return> & OnSignature<BaseLayerObjectEventTypes | LayerEventType | "change:preload" | "change:useInterimTilesOnError", ObjectEvent, Return> & OnSignature<LayerRenderEventTypes, RenderEvent, Return> & CombinedOnSignature<EventTypes | BaseLayerObjectEventTypes | LayerEventType | "change:preload" | "change:useInterimTilesOnError" | LayerRenderEventTypes, Return>;
type Options$d<TileSourceType extends TileSource> = {
    /**
     * A CSS class name to set to the layer element.
     */
    className?: string | undefined;
    /**
     * Opacity (0, 1).
     */
    opacity?: number | undefined;
    /**
     * Visibility.
     */
    visible?: boolean | undefined;
    /**
     * The bounding extent for layer rendering.  The layer will not be
     * rendered outside of this extent.
     */
    extent?: Extent | undefined;
    /**
     * The z-index for layer rendering.  At rendering time, the layers
     * will be ordered, first by Z-index and then by position. When `undefined`, a `zIndex` of 0 is assumed
     * for layers that are added to the map's `layers` collection, or `Infinity` when the layer's `setMap()`
     * method was used.
     */
    zIndex?: number | undefined;
    /**
     * The minimum resolution (inclusive) at which this layer will be
     * visible.
     */
    minResolution?: number | undefined;
    /**
     * The maximum resolution (exclusive) below which this layer will
     * be visible.
     */
    maxResolution?: number | undefined;
    /**
     * The minimum view zoom level (exclusive) above which this layer will be
     * visible.
     */
    minZoom?: number | undefined;
    /**
     * The maximum view zoom level (inclusive) at which this layer will
     * be visible.
     */
    maxZoom?: number | undefined;
    /**
     * Preload. Load low-resolution tiles up to `preload` levels. `0`
     * means no preloading.
     */
    preload?: number | undefined;
    /**
     * Source for this layer.
     */
    source?: TileSourceType | undefined;
    /**
     * Sets the layer as overlay on a map. The map will not manage
     * this layer in its layers collection, and the layer will be rendered on top. This is useful for
     * temporary layers. The standard way to add a layer to a map and have it managed by the map is to
     * use {@link import ("../Map.js").default#addLayer map.addLayer()}.
     */
    map?: Map | undefined;
    /**
     * Background color for the layer. If not specified, no background
     * will be rendered.
     */
    background?: BackgroundColor | undefined;
    /**
     * Deprecated.  Use interim tiles on error.
     */
    useInterimTilesOnError?: boolean | undefined;
    /**
     * Arbitrary observable properties. Can be accessed with `#get()` and `#set()`.
     */
    properties?: {
        [x: string]: any;
    } | undefined;
    /**
     * The internal tile cache size.  This needs to be large enough to render
     * two zoom levels worth of tiles.
     */
    cacheSize?: number | undefined;
};
/***
 * @template Return
 * @typedef {import("../Observable").OnSignature<import("../Observable").EventTypes, import("../events/Event.js").default, Return> &
 *   import("../Observable").OnSignature<import("./Base").BaseLayerObjectEventTypes|
 *     import("./Layer.js").LayerEventType|'change:preload'|'change:useInterimTilesOnError', import("../Object").ObjectEvent, Return> &
 *   import("../Observable").OnSignature<import("../render/EventType").LayerRenderEventTypes, import("../render/Event").default, Return> &
 *   import("../Observable").CombinedOnSignature<import("../Observable").EventTypes|import("./Base").BaseLayerObjectEventTypes|
 *   import("./Layer.js").LayerEventType|'change:preload'|'change:useInterimTilesOnError'|import("../render/EventType").LayerRenderEventTypes, Return>} BaseTileLayerOnSignature
 */
/**
 * @template {import("../source/Tile.js").default} TileSourceType
 * @typedef {Object} Options
 * @property {string} [className='ol-layer'] A CSS class name to set to the layer element.
 * @property {number} [opacity=1] Opacity (0, 1).
 * @property {boolean} [visible=true] Visibility.
 * @property {import("../extent.js").Extent} [extent] The bounding extent for layer rendering.  The layer will not be
 * rendered outside of this extent.
 * @property {number} [zIndex] The z-index for layer rendering.  At rendering time, the layers
 * will be ordered, first by Z-index and then by position. When `undefined`, a `zIndex` of 0 is assumed
 * for layers that are added to the map's `layers` collection, or `Infinity` when the layer's `setMap()`
 * method was used.
 * @property {number} [minResolution] The minimum resolution (inclusive) at which this layer will be
 * visible.
 * @property {number} [maxResolution] The maximum resolution (exclusive) below which this layer will
 * be visible.
 * @property {number} [minZoom] The minimum view zoom level (exclusive) above which this layer will be
 * visible.
 * @property {number} [maxZoom] The maximum view zoom level (inclusive) at which this layer will
 * be visible.
 * @property {number} [preload=0] Preload. Load low-resolution tiles up to `preload` levels. `0`
 * means no preloading.
 * @property {TileSourceType} [source] Source for this layer.
 * @property {import("../Map.js").default} [map] Sets the layer as overlay on a map. The map will not manage
 * this layer in its layers collection, and the layer will be rendered on top. This is useful for
 * temporary layers. The standard way to add a layer to a map and have it managed by the map is to
 * use {@link import("../Map.js").default#addLayer map.addLayer()}.
 * @property {import("./Base.js").BackgroundColor} [background] Background color for the layer. If not specified, no background
 * will be rendered.
 * @property {boolean} [useInterimTilesOnError=true] Deprecated.  Use interim tiles on error.
 * @property {Object<string, *>} [properties] Arbitrary observable properties. Can be accessed with `#get()` and `#set()`.
 * @property {number} [cacheSize=512] The internal tile cache size.  This needs to be large enough to render
 * two zoom levels worth of tiles.
 */
/**
 * @classdesc
 * For layer sources that provide pre-rendered, tiled images in grids that are
 * organized by zoom levels for specific resolutions.
 * Note that any property set in the options is set as a {@link module:ol/Object~BaseObject}
 * property on the layer object; for example, setting `title: 'My Title'` in the
 * options means that `title` is observable, and has get/set accessors.
 *
 * @template {import("../source/Tile.js").default} TileSourceType
 * @template {import("../renderer/Layer.js").default} RendererType
 * @extends {Layer<TileSourceType, RendererType>}
 * @api
 */
declare class BaseTileLayer<TileSourceType extends TileSource, RendererType extends LayerRenderer<any>> extends Layer<TileSourceType, RendererType> {
    /**
     * @param {Options<TileSourceType>} [options] Tile layer options.
     */
    constructor(options?: Options$d<TileSourceType>);
    /***
     * @type {BaseTileLayerOnSignature<import("../events").EventsKey>}
     */
    on: BaseTileLayerOnSignature<EventsKey>;
    /***
     * @type {BaseTileLayerOnSignature<import("../events").EventsKey>}
     */
    once: BaseTileLayerOnSignature<EventsKey>;
    /***
     * @type {BaseTileLayerOnSignature<void>}
     */
    un: BaseTileLayerOnSignature<void>;
    /**
     * @type {number|undefined}
     * @private
     */
    private cacheSize_;
    /**
     * @return {number|undefined} The suggested cache size
     * @protected
     */
    protected getCacheSize(): number | undefined;
    /**
     * Return the level as number to which we will preload tiles up to.
     * @return {number} The level to preload tiles up to.
     * @observable
     * @api
     */
    getPreload(): number;
    /**
     * Set the level as number to which we will preload tiles up to.
     * @param {number} preload The level to preload tiles up to.
     * @observable
     * @api
     */
    setPreload(preload: number): void;
    /**
     * Deprecated.  Whether we use interim tiles on error.
     * @return {boolean} Use interim tiles on error.
     * @observable
     * @api
     */
    getUseInterimTilesOnError(): boolean;
    /**
     * Deprecated.  Set whether we use interim tiles on error.
     * @param {boolean} useInterimTilesOnError Use interim tiles on error.
     * @observable
     * @api
     */
    setUseInterimTilesOnError(useInterimTilesOnError: boolean): void;
}

/**
 * @classdesc
 * For layer sources that provide pre-rendered, tiled images in grids that are
 * organized by zoom levels for specific resolutions.
 * Note that any property set in the options is set as a {@link module:ol/Object~BaseObject}
 * property on the layer object; for example, setting `title: 'My Title'` in the
 * options means that `title` is observable, and has get/set accessors.
 *
 * @template {import("../source/Tile.js").default} [TileSourceType=import("../source/Tile.js").default]
 * @extends BaseTileLayer<TileSourceType, CanvasTileLayerRenderer>
 * @api
 */
declare class TileLayer<TileSourceType extends TileSource = TileSource<Tile>> extends BaseTileLayer<TileSourceType, CanvasTileLayerRenderer<TileLayer<TileSource<Tile>> | VectorTileLayer<VectorTile<any>, any>>> {
    /**
     * @param {import("./BaseTile.js").Options<TileSourceType>} [options] Tile layer options.
     */
    constructor(options?: Options$d<TileSourceType>);
    /**
     * @override
     */
    override createRenderer(): CanvasTileLayerRenderer<this>;
}
//# sourceMappingURL=Tile.d.ts.map

type TileLookup = {
    [x: number]: Set<Tile>;
};
type Options$c = {
    /**
     * The cache size.
     */
    cacheSize?: number | undefined;
};
/**
 * @typedef {Object} Options
 * @property {number} [cacheSize=512] The cache size.
 */
/**
 * @classdesc
 * Canvas renderer for tile layers.
 * @api
 * @template {import("../../layer/Tile.js").default|import("../../layer/VectorTile.js").default} [LayerType=import("../../layer/Tile.js").default<import("../../source/Tile.js").default>|import("../../layer/VectorTile.js").default]
 * @extends {CanvasLayerRenderer<LayerType>}
 */
declare class CanvasTileLayerRenderer<LayerType extends TileLayer | VectorTileLayer = TileLayer<TileSource<Tile>> | VectorTileLayer<VectorTile<any>, any>> extends CanvasLayerRenderer<LayerType> {
    /**
     * @param {LayerType} tileLayer Tile layer.
     * @param {Options} [options] Options.
     */
    constructor(tileLayer: LayerType, options?: Options$c);
    /**
     * Rendered extent has changed since the previous `renderFrame()` call
     * @type {boolean}
     */
    extentChanged: boolean;
    /**
     * The last call to `renderFrame` was completed with all tiles loaded
     * @type {boolean}
     */
    renderComplete: boolean;
    /**
     * @private
     * @type {?import("../../extent.js").Extent}
     */
    private renderedExtent_;
    /**
     * @protected
     * @type {number}
     */
    protected renderedPixelRatio: number;
    /**
     * @protected
     * @type {import("../../proj/Projection.js").default|null}
     */
    protected renderedProjection: Projection | null;
    /**
     * @protected
     * @type {!Array<import("../../Tile.js").default>}
     */
    protected renderedTiles: Array<Tile>;
    /**
     * @private
     * @type {string}
     */
    private renderedSourceKey_;
    /**
     * @private
     * @type {number}
     */
    private renderedSourceRevision_;
    /**
     * @protected
     * @type {import("../../extent.js").Extent}
     */
    protected tempExtent: Extent;
    /**
     * @private
     * @type {import("../../TileRange.js").default}
     */
    private tempTileRange_;
    /**
     * @type {import("../../tilecoord.js").TileCoord}
     * @private
     */
    private tempTileCoord_;
    /**
     * @type {import("../../structs/LRUCache.js").default<import("../../Tile.js").default>}
     * @private
     */
    private tileCache_;
    /**
     * @type {import("../../structs/LRUCache.js").default<import("../../Tile.js").default|null>}
     * @private
     */
    private sourceTileCache_;
    /**
     * @return {LRUCache} Tile cache.
     */
    getTileCache(): LRUCache<any>;
    /**
     * @return {LRUCache} Tile cache.
     */
    getSourceTileCache(): LRUCache<any>;
    /**
     * Get a tile from the cache or create one if needed.
     *
     * @param {number} z Tile coordinate z.
     * @param {number} x Tile coordinate x.
     * @param {number} y Tile coordinate y.
     * @param {import("../../Map.js").FrameState} frameState Frame state.
     * @return {import("../../Tile.js").default|null} Tile (or null if outside source extent).
     * @protected
     */
    protected getOrCreateTile(z: number, x: number, y: number, frameState: FrameState): Tile | null;
    /**
     * @param {number} z Tile coordinate z.
     * @param {number} x Tile coordinate x.
     * @param {number} y Tile coordinate y.
     * @param {import("../../Map.js").FrameState} frameState Frame state.
     * @return {import("../../Tile.js").default|null} Tile (or null if outside source extent).
     * @protected
     */
    protected getTile(z: number, x: number, y: number, frameState: FrameState): Tile | null;
    /**
     * @param {import("../../pixel.js").Pixel} pixel Pixel.
     * @return {Uint8ClampedArray} Data at the pixel location.
     * @override
     */
    override getData(pixel: Pixel): Uint8ClampedArray;
    /**
     * Determine whether tiles for next extent should be enqueued for rendering.
     * @return {boolean} Rendering tiles for next extent is supported.
     * @protected
     */
    protected enqueueTilesForNextExtent(): boolean;
    /**
     * @param {import("../../Map.js").FrameState} frameState Frame state.
     * @param {import("../../extent.js").Extent} extent The extent to be rendered.
     * @param {number} initialZ The zoom level.
     * @param {TileLookup} tilesByZ Lookup of tiles by zoom level.
     * @param {number} preload Number of additional levels to load.
     */
    enqueueTiles(frameState: FrameState, extent: Extent, initialZ: number, tilesByZ: TileLookup, preload: number): void;
    /**
     * Look for tiles covering the provided tile coordinate at an alternate
     * zoom level.  Loaded tiles will be added to the provided tile texture lookup.
     * @param {import("../../tilecoord.js").TileCoord} tileCoord The target tile coordinate.
     * @param {TileLookup} tilesByZ Lookup of tiles by zoom level.
     * @return {boolean} The tile coordinate is covered by loaded tiles at the alternate zoom level.
     * @private
     */
    private findStaleTile_;
    /**
     * Look for tiles covering the provided tile coordinate at an alternate
     * zoom level.  Loaded tiles will be added to the provided tile texture lookup.
     * @param {import("../../tilegrid/TileGrid.js").default} tileGrid The tile grid.
     * @param {import("../../tilecoord.js").TileCoord} tileCoord The target tile coordinate.
     * @param {number} altZ The alternate zoom level.
     * @param {TileLookup} tilesByZ Lookup of tiles by zoom level.
     * @return {boolean} The tile coordinate is covered by loaded tiles at the alternate zoom level.
     * @private
     */
    private findAltTiles_;
    /**
     * Render the layer.
     *
     * The frame rendering logic has three parts:
     *
     *  1. Enqueue tiles
     *  2. Find alt tiles for those that are not yet loaded
     *  3. Render loaded tiles
     *
     * @param {import("../../Map.js").FrameState} frameState Frame state.
     * @param {HTMLElement} target Target that may be used to render content to.
     * @return {HTMLElement} The rendered element.
     * @override
     */
    override renderFrame(frameState: FrameState, target: HTMLElement): HTMLElement;
    /**
     * Increases the cache size if needed
     * @param {number} tileCount Minimum number of tiles needed.
     */
    updateCacheSize(tileCount: number): void;
    /**
     * @param {import("../../Tile.js").default} tile Tile.
     * @param {import("../../Map.js").FrameState} frameState Frame state.
     * @param {number} x Left of the tile.
     * @param {number} y Top of the tile.
     * @param {number} w Width of the tile.
     * @param {number} h Height of the tile.
     * @param {number} gutter Tile gutter.
     * @param {boolean} transition Apply an alpha transition.
     * @protected
     */
    protected drawTile(tile: Tile, frameState: FrameState, x: number, y: number, w: number, h: number, gutter: number, transition: boolean): void;
    /**
     * @return {HTMLCanvasElement|OffscreenCanvas} Image
     */
    getImage(): HTMLCanvasElement | OffscreenCanvas;
    /**
     * Get the image from a tile.
     * @param {import("../../ImageTile.js").default} tile Tile.
     * @return {HTMLCanvasElement|OffscreenCanvas|HTMLImageElement|HTMLVideoElement} Image.
     * @protected
     */
    protected getTileImage(tile: ImageTile): HTMLCanvasElement | OffscreenCanvas | HTMLImageElement | HTMLVideoElement;
    /**
     * @param {!Object<string, !Object<string, boolean>>} usedTiles Used tiles.
     * @param {import("../../source/Tile.js").default} tileSource Tile source.
     * @param {import('../../Tile.js').default} tile Tile.
     * @protected
     */
    protected updateUsedTiles(usedTiles: {
        [x: string]: {
            [x: string]: boolean;
        };
    }, tileSource: TileSource, tile: Tile): void;
}

/**
 * @classdesc
 * Canvas renderer for vector tile layers.
 * @api
 * @extends {CanvasTileLayerRenderer<import("../../layer/VectorTile.js").default<import('../../source/VectorTile.js').default<import('../../Feature.js').FeatureLike>>>}
 */
declare class CanvasVectorTileLayerRenderer extends CanvasTileLayerRenderer<VectorTileLayer<VectorTile<FeatureLike>, FeatureLike>> {
    /**
     * @param {import("../../layer/VectorTile.js").default} layer VectorTile layer.
     * @param {import("./TileLayer.js").Options} options Options.
     */
    constructor(layer: VectorTileLayer, options: Options$c);
    /** @private */
    private boundHandleStyleImageChange_;
    /**
     * @private
     * @type {number}
     */
    private renderedLayerRevision_;
    /**
     * @private
     * @type {import("../../transform").Transform}
     */
    private renderedPixelToCoordinateTransform_;
    /**
     * @private
     * @type {number}
     */
    private renderedRotation_;
    /**
     * @private
     * @type {number}
     */
    private renderedOpacity_;
    /**
     * @private
     * @type {import("../../transform.js").Transform}
     */
    private tmpTransform_;
    /**
     * @private
     * @type {Array<ZIndexContext>}
     */
    private tileClipContexts_;
    /**
     * @param {import("../../VectorRenderTile.js").default} tile Tile.
     * @param {import("../../Map.js").FrameState} frameState Frame state.
     * @param {number} x Left of the tile.
     * @param {number} y Top of the tile.
     * @param {number} w Width of the tile.
     * @param {number} h Height of the tile.
     * @param {number} gutter Tile gutter.
     * @param {boolean} transition Apply an alpha transition.
     * @override
     */
    override drawTile(tile: VectorRenderTile, frameState: FrameState, x: number, y: number, w: number, h: number, gutter: number, transition: boolean): void;
    /**
     * @param {import("../../VectorRenderTile.js").default} tile Tile.
     * @param {number} pixelRatio Pixel ratio.
     * @param {import("../../proj/Projection.js").default} projection Projection.
     * @private
     */
    private updateExecutorGroup_;
    /**
     * @param {import("../../extent.js").Extent} extent Extent.
     * @return {Array<import('../../Feature.js').FeatureLike>} Features.
     */
    getFeaturesInExtent(extent: Extent): Array<FeatureLike>;
    /**
     * Handle changes in image style state.
     * @param {import("../../events/Event.js").default} event Image style change event.
     * @private
     */
    private handleStyleImageChange_;
    /**
     * Render declutter items for this layer
     * @param {import("../../Map.js").FrameState} frameState Frame state.
     * @param {import("../../layer/Layer.js").State} layerState Layer state.
     */
    renderDeclutter(frameState: FrameState, layerState: State$2): void;
    /**
     * @param {import("../../VectorRenderTile.js").default} tile The tile
     * @param {import('../../Map.js').FrameState} frameState Current frame state
     * @return {import('../../transform.js').Transform} Transform to use to render this tile
     */
    getTileRenderTransform(tile: VectorRenderTile, frameState: FrameState): Transform;
    /**
     * @param {import("../../Feature.js").FeatureLike} feature Feature.
     * @param {number} squaredTolerance Squared tolerance.
     * @param {import("../../style/Style.js").default|Array<import("../../style/Style.js").default>} styles The style or array of styles.
     * @param {import("../../render/canvas/BuilderGroup.js").default} builderGroup Replay group.
     * @param {boolean} [declutter] Enable decluttering.
     * @param {number} [index] Render order index.
     * @return {boolean} `true` if an image is loading.
     */
    renderFeature(feature: FeatureLike, squaredTolerance: number, styles: Style$2 | Array<Style$2>, builderGroup: BuilderGroup, declutter?: boolean, index?: number): boolean;
    /**
     * @param {import("../../VectorRenderTile.js").default} tile Tile.
     * @return {boolean} A new tile image was rendered.
     * @private
     */
    private tileImageNeedsRender_;
    /**
     * @param {import("../../VectorRenderTile.js").default} tile Tile.
     * @param {import("../../Map").FrameState} frameState Frame state.
     * @private
     */
    private renderTileImage_;
}
//# sourceMappingURL=VectorTileLayer.d.ts.map

/**
 * @classdesc
 * Canvas renderer for vector layers.
 * @api
 */
declare class CanvasVectorLayerRenderer extends CanvasLayerRenderer<any> {
    /**
     * @param {import("../../layer/BaseVector.js").default} vectorLayer Vector layer.
     */
    constructor(vectorLayer: BaseVectorLayer<any, any, any>);
    /** @private */
    private boundHandleStyleImageChange_;
    /**
     * @private
     * @type {boolean}
     */
    private animatingOrInteracting_;
    /**
     * @private
     * @type {ImageData|null}
     */
    private hitDetectionImageData_;
    /**
     * @private
     * @type {boolean}
     */
    private clipped_;
    /**
     * @private
     * @type {Array<import("../../Feature.js").default>}
     */
    private renderedFeatures_;
    /**
     * @private
     * @type {number}
     */
    private renderedRevision_;
    /**
     * @private
     * @type {number}
     */
    private renderedResolution_;
    /**
     * @private
     * @type {import("../../extent.js").Extent}
     */
    private renderedExtent_;
    /**
     * @private
     * @type {import("../../extent.js").Extent}
     */
    private wrappedRenderedExtent_;
    /**
     * @private
     * @type {number}
     */
    private renderedRotation_;
    /**
     * @private
     * @type {import("../../coordinate").Coordinate}
     */
    private renderedCenter_;
    /**
     * @private
     * @type {import("../../proj/Projection").default}
     */
    private renderedProjection_;
    /**
     * @private
     * @type {number}
     */
    private renderedPixelRatio_;
    /**
     * @private
     * @type {import("../../render.js").OrderFunction|null}
     */
    private renderedRenderOrder_;
    /**
     * @private
     * @type {boolean}
     */
    private renderedFrameDeclutter_;
    /**
     * @private
     * @type {import("../../render/canvas/ExecutorGroup").default}
     */
    private replayGroup_;
    /**
     * A new replay group had to be created by `prepareFrame()`
     * @type {boolean}
     */
    replayGroupChanged: boolean;
    /**
     * Clipping to be performed by `renderFrame()`
     * @type {boolean}
     */
    clipping: boolean;
    /**
     * @private
     * @type {CanvasRenderingContext2D|OffscreenCanvasRenderingContext2D}
     */
    private targetContext_;
    /**
     * @private
     * @type {number}
     */
    private opacity_;
    /**
     * @param {ExecutorGroup} executorGroup Executor group.
     * @param {import("../../Map.js").FrameState} frameState Frame state.
     * @param {boolean} [declutterable] `true` to only render declutterable items,
     *     `false` to only render non-declutterable items, `undefined` to render all.
     */
    renderWorlds(executorGroup: ExecutorGroup, frameState: FrameState, declutterable?: boolean): void;
    /**
     * @private
     */
    private setDrawContext_;
    /**
     * @private
     */
    private resetDrawContext_;
    /**
     * Render declutter items for this layer
     * @param {import("../../Map.js").FrameState} frameState Frame state.
     */
    renderDeclutter(frameState: FrameState): void;
    /**
     * Asynchronous layer level hit detection.
     * @param {import("../../pixel.js").Pixel} pixel Pixel.
     * @return {Promise<Array<import("../../Feature").default>>} Promise
     * that resolves with an array of features.
     * @override
     */
    override getFeatures(pixel: Pixel): Promise<Array<Feature$1>>;
    /**
     * Handle changes in image style state.
     * @param {import("../../events/Event.js").default} event Image style change event.
     * @private
     */
    private handleStyleImageChange_;
    /**
     * @param {import("../../Feature.js").default} feature Feature.
     * @param {number} squaredTolerance Squared render tolerance.
     * @param {import("../../style/Style.js").default|Array<import("../../style/Style.js").default>} styles The style or array of styles.
     * @param {import("../../render/canvas/BuilderGroup.js").default} builderGroup Builder group.
     * @param {import("../../proj.js").TransformFunction} [transform] Transform from user to view projection.
     * @param {boolean} [declutter] Enable decluttering.
     * @param {number} [index] Render order index.
     * @return {boolean} `true` if an image is loading.
     */
    renderFeature(feature: Feature$1, squaredTolerance: number, styles: Style$2 | Array<Style$2>, builderGroup: BuilderGroup, transform?: TransformFunction, declutter?: boolean, index?: number): boolean;
}
//# sourceMappingURL=VectorLayer.d.ts.map

/**
 * *
 */
type ExtractedFeatureType$1<T> = T extends VectorSource<infer U extends FeatureLike> ? U : never;
type Options$b<FeatureType extends FeatureLike, VectorSourceType extends VectorSource<FeatureType> | VectorTile<FeatureType>> = {
    /**
     * A CSS class name to set to the layer element.
     */
    className?: string | undefined;
    /**
     * Opacity (0, 1).
     */
    opacity?: number | undefined;
    /**
     * Visibility.
     */
    visible?: boolean | undefined;
    /**
     * The bounding extent for layer rendering.  The layer will not be
     * rendered outside of this extent.
     */
    extent?: Extent | undefined;
    /**
     * The z-index for layer rendering.  At rendering time, the layers
     * will be ordered, first by Z-index and then by position. When `undefined`, a `zIndex` of 0 is assumed
     * for layers that are added to the map's `layers` collection, or `Infinity` when the layer's `setMap()`
     * method was used.
     */
    zIndex?: number | undefined;
    /**
     * The minimum resolution (inclusive) at which this layer will be
     * visible.
     */
    minResolution?: number | undefined;
    /**
     * The maximum resolution (exclusive) below which this layer will
     * be visible.
     */
    maxResolution?: number | undefined;
    /**
     * The minimum view zoom level (exclusive) above which this layer will be
     * visible.
     */
    minZoom?: number | undefined;
    /**
     * The maximum view zoom level (inclusive) at which this layer will
     * be visible.
     */
    maxZoom?: number | undefined;
    /**
     * Render order. Function to be used when sorting
     * features before rendering. By default features are drawn in the order that they are created. Use
     * `null` to avoid the sort, but get an undefined draw order.
     */
    renderOrder?: OrderFunction | undefined;
    /**
     * The buffer in pixels around the viewport extent used by the
     * renderer when getting features from the vector source for the rendering or hit-detection.
     * Recommended value: the size of the largest symbol, line width or label.
     */
    renderBuffer?: number | undefined;
    /**
     * Source.
     */
    source?: VectorSourceType | undefined;
    /**
     * Sets the layer as overlay on a map. The map will not manage
     * this layer in its layers collection, and the layer will be rendered on top. This is useful for
     * temporary layers. The standard way to add a layer to a map and have it managed by the map is to
     * use [map.addLayer()]{@link import ("../Map.js").default#addLayer}.
     */
    map?: Map | undefined;
    /**
     * Declutter images and text. Any truthy value will enable
     * decluttering. Within a layer, a feature rendered before another has higher priority. All layers with the
     * same `declutter` value will be decluttered together. The priority is determined by the drawing order of the
     * layers with the same `declutter` value. Higher in the layer stack means higher priority. To declutter distinct
     * layers or groups of layers separately, use different truthy values for `declutter`.
     */
    declutter?: string | number | boolean | undefined;
    /**
     * Layer style. When set to `null`, only
     * features that have their own style will be rendered. See {@link module :ol/style/Style~Style} for the default style
     * which will be used if this is not set.
     */
    style?: StyleLike | FlatStyleLike$1 | null | undefined;
    /**
     * Background color for the layer. If not specified, no background
     * will be rendered.
     */
    background?: BackgroundColor | undefined;
    /**
     * When set to `true`, feature batches will
     * be recreated during animations. This means that no vectors will be shown clipped, but the
     * setting will have a performance impact for large amounts of vector data. When set to `false`,
     * batches will be recreated when no animation is active.
     */
    updateWhileAnimating?: boolean | undefined;
    /**
     * When set to `true`, feature batches will
     * be recreated during interactions. See also `updateWhileAnimating`.
     */
    updateWhileInteracting?: boolean | undefined;
    /**
     * Arbitrary observable properties. Can be accessed with `#get()` and `#set()`.
     */
    properties?: {
        [x: string]: any;
    } | undefined;
};
/**
 * @classdesc
 * Vector data that is rendered client-side.
 * Note that any property set in the options is set as a {@link module:ol/Object~BaseObject}
 * property on the layer object; for example, setting `title: 'My Title'` in the
 * options means that `title` is observable, and has get/set accessors.
 *
 * @template {import('../Feature').FeatureLike} FeatureType
 * @template {import("../source/Vector.js").default<FeatureType>|import("../source/VectorTile.js").default<FeatureType>} VectorSourceType<FeatureType>
 * @extends {Layer<VectorSourceType, RendererType>}
 * @template {import("../renderer/canvas/VectorLayer.js").default|import("../renderer/canvas/VectorTileLayer.js").default|import("../renderer/canvas/VectorImageLayer.js").default|import("../renderer/webgl/VectorLayer.js").default|import("../renderer/webgl/PointsLayer.js").default} RendererType
 * @api
 */
declare class BaseVectorLayer<FeatureType extends FeatureLike, VectorSourceType extends VectorSource<FeatureType> | VectorTile<FeatureType>, RendererType extends CanvasVectorLayerRenderer | CanvasVectorTileLayerRenderer | CanvasVectorImageLayerRenderer | WebGLVectorLayerRenderer | WebGLPointsLayerRenderer> extends Layer<VectorSourceType, RendererType> {
    /**
     * @param {Options<FeatureType, VectorSourceType>} [options] Options.
     */
    constructor(options?: Options$b<FeatureType, VectorSourceType>);
    /**
     * @private
     * @type {string}
     */
    private declutter_;
    /**
     * @type {number}
     * @private
     */
    private renderBuffer_;
    /**
     * User provided style.
     * @type {import("../style/Style.js").StyleLike|import("../style/flat.js").FlatStyleLike}
     * @private
     */
    private style_;
    /**
     * Style function for use within the library.
     * @type {import("../style/Style.js").StyleFunction|undefined}
     * @private
     */
    private styleFunction_;
    /**
     * @type {boolean}
     * @private
     */
    private updateWhileAnimating_;
    /**
     * @type {boolean}
     * @private
     */
    private updateWhileInteracting_;
    /**
     * @return {number|undefined} Render buffer.
     */
    getRenderBuffer(): number | undefined;
    /**
     * @return {import("../render.js").OrderFunction|null|undefined} Render order.
     */
    getRenderOrder(): OrderFunction | null | undefined;
    /**
     * Get the style for features.  This returns whatever was passed to the `style`
     * option at construction or to the `setStyle` method.
     * @return {import("../style/Style.js").StyleLike|import("../style/flat.js").FlatStyleLike|null|undefined} Layer style.
     * @api
     */
    getStyle(): StyleLike | FlatStyleLike$1 | null | undefined;
    /**
     * Get the style function.
     * @return {import("../style/Style.js").StyleFunction|undefined} Layer style function.
     * @api
     */
    getStyleFunction(): StyleFunction | undefined;
    /**
     * @return {boolean} Whether the rendered layer should be updated while
     *     animating.
     */
    getUpdateWhileAnimating(): boolean;
    /**
     * @return {boolean} Whether the rendered layer should be updated while
     *     interacting.
     */
    getUpdateWhileInteracting(): boolean;
    /**
     * @param {import("../render.js").OrderFunction|null|undefined} renderOrder
     *     Render order.
     */
    setRenderOrder(renderOrder: OrderFunction | null | undefined): void;
    /**
     * Set the style for features.  This can be a single style object, an array
     * of styles, or a function that takes a feature and resolution and returns
     * an array of styles. If set to `null`, the layer has no style (a `null` style),
     * so only features that have their own styles will be rendered in the layer. Call
     * `setStyle()` without arguments to reset to the default style. See
     * [the ol/style/Style module]{@link module:ol/style/Style~Style} for information on the default style.
     *
     * If your layer has a static style, you can use [flat style]{@link module:ol/style/flat~FlatStyle} object
     * literals instead of using the `Style` and symbolizer constructors (`Fill`, `Stroke`, etc.):
     * ```js
     * vectorLayer.setStyle({
     *   "fill-color": "yellow",
     *   "stroke-color": "black",
     *   "stroke-width": 4
     * })
     * ```
     *
     * @param {import("../style/Style.js").StyleLike|import("../style/flat.js").FlatStyleLike|null} [style] Layer style.
     * @api
     */
    setStyle(style?: StyleLike | FlatStyleLike$1 | null): void;
    /**
     * @param {boolean|string|number} declutter Declutter images and text.
     * @api
     */
    setDeclutter(declutter: boolean | string | number): void;
}

type Options$a<VectorSourceType extends VectorSource<FeatureType> = VectorSource<any>, FeatureType extends FeatureLike = ExtractedFeatureType$1<VectorSourceType>> = {
    /**
     * A CSS class name to set to the layer element.
     */
    className?: string | undefined;
    /**
     * Opacity (0, 1).
     */
    opacity?: number | undefined;
    /**
     * Visibility.
     */
    visible?: boolean | undefined;
    /**
     * The bounding extent for layer rendering.  The layer will not be
     * rendered outside of this extent.
     */
    extent?: Extent | undefined;
    /**
     * The z-index for layer rendering.  At rendering time, the layers
     * will be ordered, first by Z-index and then by position. When `undefined`, a `zIndex` of 0 is assumed
     * for layers that are added to the map's `layers` collection, or `Infinity` when the layer's `setMap()`
     * method was used.
     */
    zIndex?: number | undefined;
    /**
     * The minimum resolution (inclusive) at which this layer will be
     * visible.
     */
    minResolution?: number | undefined;
    /**
     * The maximum resolution (exclusive) below which this layer will
     * be visible.
     */
    maxResolution?: number | undefined;
    /**
     * The minimum view zoom level (exclusive) above which this layer will be
     * visible.
     */
    minZoom?: number | undefined;
    /**
     * The maximum view zoom level (inclusive) at which this layer will
     * be visible.
     */
    maxZoom?: number | undefined;
    /**
     * Render order. Function to be used when sorting
     * features before rendering. By default features are drawn in the order that they are created. Use
     * `null` to avoid the sort, but get an undefined draw order.
     */
    renderOrder?: OrderFunction | undefined;
    /**
     * The buffer in pixels around the viewport extent used by the
     * renderer when getting features from the vector source for the rendering or hit-detection.
     * Recommended value: the size of the largest symbol, line width or label.
     */
    renderBuffer?: number | undefined;
    /**
     * Source.
     */
    source?: VectorSourceType | undefined;
    /**
     * Sets the layer as overlay on a map. The map will not manage
     * this layer in its layers collection, and the layer will be rendered on top. This is useful for
     * temporary layers. The standard way to add a layer to a map and have it managed by the map is to
     * use [map.addLayer()]{@link import ("../Map.js").default#addLayer}.
     */
    map?: Map | undefined;
    /**
     * Declutter images and text. Any truthy value will enable
     * decluttering. Within a layer, a feature rendered before another has higher priority. All layers with the
     * same `declutter` value will be decluttered together. The priority is determined by the drawing order of the
     * layers with the same `declutter` value. Higher in the layer stack means higher priority. To declutter distinct
     * layers or groups of layers separately, use different truthy values for `declutter`.
     */
    declutter?: string | number | boolean | undefined;
    /**
     * Layer style. When set to `null`, only
     * features that have their own style will be rendered. See {@link module :ol/style/Style~Style} for the default style
     * which will be used if this is not set.
     */
    style?: StyleLike | FlatStyleLike$1 | null | undefined;
    /**
     * Background color for the layer. If not specified, no background
     * will be rendered.
     */
    background?: BackgroundColor | undefined;
    /**
     * When set to `true`, feature batches will
     * be recreated during animations. This means that no vectors will be shown clipped, but the
     * setting will have a performance impact for large amounts of vector data. When set to `false`,
     * batches will be recreated when no animation is active.
     */
    updateWhileAnimating?: boolean | undefined;
    /**
     * When set to `true`, feature batches will
     * be recreated during interactions. See also `updateWhileAnimating`.
     */
    updateWhileInteracting?: boolean | undefined;
    /**
     * Arbitrary observable properties. Can be accessed with `#get()` and `#set()`.
     */
    properties?: {
        [x: string]: any;
    } | undefined;
};
/**
 * @template {import("../source/Vector.js").default<FeatureType>} [VectorSourceType=import("../source/Vector.js").default<*>]
 * @template {import('../Feature.js').FeatureLike} [FeatureType=import("./BaseVector.js").ExtractedFeatureType<VectorSourceType>]
 * @typedef {Object} Options
 * @property {string} [className='ol-layer'] A CSS class name to set to the layer element.
 * @property {number} [opacity=1] Opacity (0, 1).
 * @property {boolean} [visible=true] Visibility.
 * @property {import("../extent.js").Extent} [extent] The bounding extent for layer rendering.  The layer will not be
 * rendered outside of this extent.
 * @property {number} [zIndex] The z-index for layer rendering.  At rendering time, the layers
 * will be ordered, first by Z-index and then by position. When `undefined`, a `zIndex` of 0 is assumed
 * for layers that are added to the map's `layers` collection, or `Infinity` when the layer's `setMap()`
 * method was used.
 * @property {number} [minResolution] The minimum resolution (inclusive) at which this layer will be
 * visible.
 * @property {number} [maxResolution] The maximum resolution (exclusive) below which this layer will
 * be visible.
 * @property {number} [minZoom] The minimum view zoom level (exclusive) above which this layer will be
 * visible.
 * @property {number} [maxZoom] The maximum view zoom level (inclusive) at which this layer will
 * be visible.
 * @property {import("../render.js").OrderFunction} [renderOrder] Render order. Function to be used when sorting
 * features before rendering. By default features are drawn in the order that they are created. Use
 * `null` to avoid the sort, but get an undefined draw order.
 * @property {number} [renderBuffer=100] The buffer in pixels around the viewport extent used by the
 * renderer when getting features from the vector source for the rendering or hit-detection.
 * Recommended value: the size of the largest symbol, line width or label.
 * @property {VectorSourceType} [source] Source.
 * @property {import("../Map.js").default} [map] Sets the layer as overlay on a map. The map will not manage
 * this layer in its layers collection, and the layer will be rendered on top. This is useful for
 * temporary layers. The standard way to add a layer to a map and have it managed by the map is to
 * use [map.addLayer()]{@link import("../Map.js").default#addLayer}.
 * @property {boolean|string|number} [declutter=false] Declutter images and text. Any truthy value will enable
 * decluttering. Within a layer, a feature rendered before another has higher priority. All layers with the
 * same `declutter` value will be decluttered together. The priority is determined by the drawing order of the
 * layers with the same `declutter` value. Higher in the layer stack means higher priority. To declutter distinct
 * layers or groups of layers separately, use different truthy values for `declutter`.
 * @property {import("../style/Style.js").StyleLike|import("../style/flat.js").FlatStyleLike|null} [style] Layer style. When set to `null`, only
 * features that have their own style will be rendered. See {@link module:ol/style/Style~Style} for the default style
 * which will be used if this is not set.
 * @property {import("./Base.js").BackgroundColor} [background] Background color for the layer. If not specified, no background
 * will be rendered.
 * @property {boolean} [updateWhileAnimating=false] When set to `true`, feature batches will
 * be recreated during animations. This means that no vectors will be shown clipped, but the
 * setting will have a performance impact for large amounts of vector data. When set to `false`,
 * batches will be recreated when no animation is active.
 * @property {boolean} [updateWhileInteracting=false] When set to `true`, feature batches will
 * be recreated during interactions. See also `updateWhileAnimating`.
 * @property {Object<string, *>} [properties] Arbitrary observable properties. Can be accessed with `#get()` and `#set()`.
 */
/**
 * @classdesc
 * Vector data is rendered client-side, as vectors. This layer type provides most accurate rendering
 * even during animations. Points and labels stay upright on rotated views. For very large
 * amounts of vector data, performance may suffer during pan and zoom animations. In this case,
 * try {@link module:ol/layer/VectorImage~VectorImageLayer}.
 *
 * Note that any property set in the options is set as a {@link module:ol/Object~BaseObject}
 * property on the layer object; for example, setting `title: 'My Title'` in the
 * options means that `title` is observable, and has get/set accessors.
 *
 * @template {import("../source/Vector.js").default<FeatureType>} [VectorSourceType=import("../source/Vector.js").default<*>]
 * @template {import('../Feature.js').FeatureLike} [FeatureType=import("./BaseVector.js").ExtractedFeatureType<VectorSourceType>]
 * @extends {BaseVectorLayer<FeatureType, VectorSourceType, CanvasVectorLayerRenderer>}
 * @api
 */
declare class VectorLayer<VectorSourceType extends VectorSource<FeatureType> = VectorSource<any>, FeatureType extends FeatureLike = ExtractedFeatureType$1<VectorSourceType>> extends BaseVectorLayer<FeatureType, VectorSourceType, CanvasVectorLayerRenderer> {
    /**
     * @param {Options<VectorSourceType, FeatureType>} [options] Options.
     */
    constructor(options?: Options$a<VectorSourceType, FeatureType>);
}

type Options$9 = {
    /**
     * A CSS class name to set to the layer element.
     */
    className?: string | undefined;
    /**
     * Opacity (0, 1).
     */
    opacity?: number | undefined;
    /**
     * Visibility.
     */
    visible?: boolean | undefined;
    /**
     * The bounding extent for layer rendering.  The layer will not be
     * rendered outside of this extent.
     */
    extent?: Extent | undefined;
    /**
     * The z-index for layer rendering.  At rendering time, the layers
     * will be ordered, first by Z-index and then by position. When `undefined`, a `zIndex` of 0 is assumed
     * for layers that are added to the map's `layers` collection, or `Infinity` when the layer's `setMap()`
     * method was used.
     */
    zIndex?: number | undefined;
    /**
     * The minimum resolution (inclusive) at which this layer will be
     * visible.
     */
    minResolution?: number | undefined;
    /**
     * The maximum resolution (exclusive) below which this layer will
     * be visible.
     */
    maxResolution?: number | undefined;
    /**
     * The minimum view zoom level (exclusive) above which this layer will be
     * visible.
     */
    minZoom?: number | undefined;
    /**
     * The maximum view zoom level (inclusive) at which this layer will
     * be visible.
     */
    maxZoom?: number | undefined;
    /**
     * The maximum number of meridians and
     * parallels from the center of the map. The default value of 100 means that at
     * most 200 meridians and 200 parallels will be displayed. The default value is
     * appropriate for conformal projections like Spherical Mercator. If you
     * increase the value, more lines will be drawn and the drawing performance will
     * decrease.
     */
    maxLines?: number | undefined;
    /**
     * The
     * stroke style to use for drawing the graticule. If not provided, the following stroke will be used:
     * ```js
     * new Stroke({
     * color: 'rgba(0, 0, 0, 0.2)' // a not fully opaque black
     * });
     * ```
     */
    strokeStyle?: Stroke | undefined;
    /**
     * The target size of the graticule cells,
     * in pixels.
     */
    targetSize?: number | undefined;
    /**
     * Render a label with the respective
     * latitude/longitude for each graticule line.
     */
    showLabels?: boolean | undefined;
    /**
     * Label formatter for
     * longitudes. This function is called with the longitude as argument, and
     * should return a formatted string representing the longitude. By default,
     * labels are formatted as degrees, minutes, seconds and hemisphere.
     */
    lonLabelFormatter?: ((arg0: number) => string) | undefined;
    /**
     * Label formatter for
     * latitudes. This function is called with the latitude as argument, and
     * should return a formatted string representing the latitude. By default,
     * labels are formatted as degrees, minutes, seconds and hemisphere.
     */
    latLabelFormatter?: ((arg0: number) => string) | undefined;
    /**
     * Longitude label position in fractions
     * (0..1) of view extent. 0 means at the bottom of the viewport, 1 means at the
     * top.
     */
    lonLabelPosition?: number | undefined;
    /**
     * Latitude label position in fractions
     * (0..1) of view extent. 0 means at the left of the viewport, 1 means at the
     * right.
     */
    latLabelPosition?: number | undefined;
    /**
     * Longitude label text
     * style. If not provided, the following style will be used:
     * ```js
     * new Text({
     * font: '12px Calibri,sans-serif',
     * textBaseline: 'bottom',
     * fill: new Fill({
     * color: 'rgba(0,0,0,1)'
     * }),
     * stroke: new Stroke({
     * color: 'rgba(255,255,255,1)',
     * width: 3
     * })
     * });
     * ```
     * Note that the default's `textBaseline` configuration will not work well for
     * `lonLabelPosition` configurations that position labels close to the top of
     * the viewport.
     */
    lonLabelStyle?: Text | undefined;
    /**
     * Latitude label text style.
     * If not provided, the following style will be used:
     * ```js
     * new Text({
     * font: '12px Calibri,sans-serif',
     * textAlign: 'end',
     * fill: new Fill({
     * color: 'rgba(0,0,0,1)'
     * }),
     * stroke: Stroke({
     * color: 'rgba(255,255,255,1)',
     * width: 3
     * })
     * });
     * ```
     * Note that the default's `textAlign` configuration will not work well for
     * `latLabelPosition` configurations that position labels close to the left of
     * the viewport.
     */
    latLabelStyle?: Text | undefined;
    /**
     * Intervals (in degrees) for the graticule. Example to limit graticules to 30 and 10 degrees intervals:
     * ```js
     * [30, 10]
     * ```
     */
    intervals?: number[] | undefined;
    /**
     * Whether to repeat the graticule horizontally.
     */
    wrapX?: boolean | undefined;
    /**
     * Arbitrary observable properties. Can be accessed with `#get()` and `#set()`.
     */
    properties?: {
        [x: string]: any;
    } | undefined;
};
/**
 * @typedef {Object} GraticuleLabelDataType
 * @property {Point} geom Geometry.
 * @property {string} text Text.
 */
/**
 * @typedef {Object} Options
 * @property {string} [className='ol-layer'] A CSS class name to set to the layer element.
 * @property {number} [opacity=1] Opacity (0, 1).
 * @property {boolean} [visible=true] Visibility.
 * @property {import("../extent.js").Extent} [extent] The bounding extent for layer rendering.  The layer will not be
 * rendered outside of this extent.
 * @property {number} [zIndex] The z-index for layer rendering.  At rendering time, the layers
 * will be ordered, first by Z-index and then by position. When `undefined`, a `zIndex` of 0 is assumed
 * for layers that are added to the map's `layers` collection, or `Infinity` when the layer's `setMap()`
 * method was used.
 * @property {number} [minResolution] The minimum resolution (inclusive) at which this layer will be
 * visible.
 * @property {number} [maxResolution] The maximum resolution (exclusive) below which this layer will
 * be visible.
 * @property {number} [minZoom] The minimum view zoom level (exclusive) above which this layer will be
 * visible.
 * @property {number} [maxZoom] The maximum view zoom level (inclusive) at which this layer will
 * be visible.
 * @property {number} [maxLines=100] The maximum number of meridians and
 * parallels from the center of the map. The default value of 100 means that at
 * most 200 meridians and 200 parallels will be displayed. The default value is
 * appropriate for conformal projections like Spherical Mercator. If you
 * increase the value, more lines will be drawn and the drawing performance will
 * decrease.
 * @property {Stroke} [strokeStyle] The
 * stroke style to use for drawing the graticule. If not provided, the following stroke will be used:
 * ```js
 * new Stroke({
 *   color: 'rgba(0, 0, 0, 0.2)' // a not fully opaque black
 * });
 * ```
 * @property {number} [targetSize=100] The target size of the graticule cells,
 * in pixels.
 * @property {boolean} [showLabels=false] Render a label with the respective
 * latitude/longitude for each graticule line.
 * @property {function(number):string} [lonLabelFormatter] Label formatter for
 * longitudes. This function is called with the longitude as argument, and
 * should return a formatted string representing the longitude. By default,
 * labels are formatted as degrees, minutes, seconds and hemisphere.
 * @property {function(number):string} [latLabelFormatter] Label formatter for
 * latitudes. This function is called with the latitude as argument, and
 * should return a formatted string representing the latitude. By default,
 * labels are formatted as degrees, minutes, seconds and hemisphere.
 * @property {number} [lonLabelPosition=0] Longitude label position in fractions
 * (0..1) of view extent. 0 means at the bottom of the viewport, 1 means at the
 * top.
 * @property {number} [latLabelPosition=1] Latitude label position in fractions
 * (0..1) of view extent. 0 means at the left of the viewport, 1 means at the
 * right.
 * @property {Text} [lonLabelStyle] Longitude label text
 * style. If not provided, the following style will be used:
 * ```js
 * new Text({
 *   font: '12px Calibri,sans-serif',
 *   textBaseline: 'bottom',
 *   fill: new Fill({
 *     color: 'rgba(0,0,0,1)'
 *   }),
 *   stroke: new Stroke({
 *     color: 'rgba(255,255,255,1)',
 *     width: 3
 *   })
 * });
 * ```
 * Note that the default's `textBaseline` configuration will not work well for
 * `lonLabelPosition` configurations that position labels close to the top of
 * the viewport.
 * @property {Text} [latLabelStyle] Latitude label text style.
 * If not provided, the following style will be used:
 * ```js
 * new Text({
 *   font: '12px Calibri,sans-serif',
 *   textAlign: 'end',
 *   fill: new Fill({
 *     color: 'rgba(0,0,0,1)'
 *   }),
 *   stroke: Stroke({
 *     color: 'rgba(255,255,255,1)',
 *     width: 3
 *   })
 * });
 * ```
 * Note that the default's `textAlign` configuration will not work well for
 * `latLabelPosition` configurations that position labels close to the left of
 * the viewport.
 * @property {Array<number>} [intervals=[90, 45, 30, 20, 10, 5, 2, 1, 30/60, 20/60, 10/60, 5/60, 2/60, 1/60, 30/3600, 20/3600, 10/3600, 5/3600, 2/3600, 1/3600]]
 * Intervals (in degrees) for the graticule. Example to limit graticules to 30 and 10 degrees intervals:
 * ```js
 * [30, 10]
 * ```
 * @property {boolean} [wrapX=true] Whether to repeat the graticule horizontally.
 * @property {Object<string, *>} [properties] Arbitrary observable properties. Can be accessed with `#get()` and `#set()`.
 */
/**
 * @classdesc
 * Layer that renders a grid for a coordinate system (currently only EPSG:4326 is supported).
 * Note that the view projection must define both extent and worldExtent.
 *
 * @fires import("../render/Event.js").RenderEvent#prerender
 * @fires import("../render/Event.js").RenderEvent#postrender
 * @extends {VectorLayer<VectorSource<Feature>>}
 * @api
 */
declare class Graticule extends VectorLayer<VectorSource<Feature$1<Geometry>>, Feature$1<Geometry>> {
    /**
     * @param {Options} [options] Options.
     */
    constructor(options?: Options$9);
    /**
     * @type {import("../proj/Projection.js").default}
     * @private
     */
    private projection_;
    /**
     * @type {number}
     * @private
     */
    private maxLat_;
    /**
     * @type {number}
     * @private
     */
    private maxLon_;
    /**
     * @type {number}
     * @private
     */
    private minLat_;
    /**
     * @type {number}
     * @private
     */
    private minLon_;
    /**
     * @type {number}
     * @private
     */
    private maxX_;
    /**
     * @type {number}
     * @private
     */
    private maxY_;
    /**
     * @type {number}
     * @private
     */
    private minX_;
    /**
     * @type {number}
     * @private
     */
    private minY_;
    /**
     * @type {number}
     * @private
     */
    private targetSize_;
    /**
     * @type {number}
     * @private
     */
    private maxLines_;
    /**
     * @type {Array<LineString>}
     * @private
     */
    private meridians_;
    /**
     * @type {Array<LineString>}
     * @private
     */
    private parallels_;
    /**
     * @type {Stroke}
     * @private
     */
    private strokeStyle_;
    /**
     * @type {import("../proj.js").TransformFunction|undefined}
     * @private
     */
    private fromLonLatTransform_;
    /**
     * @type {import("../proj.js").TransformFunction|undefined}
     * @private
     */
    private toLonLatTransform_;
    /**
     * @type {import("../coordinate.js").Coordinate}
     * @private
     */
    private projectionCenterLonLat_;
    /**
     * @type {import("../coordinate.js").Coordinate}
     * @private
     */
    private bottomLeft_;
    /**
     * @type {import("../coordinate.js").Coordinate}
     * @private
     */
    private bottomRight_;
    /**
     * @type {import("../coordinate.js").Coordinate}
     * @private
     */
    private topLeft_;
    /**
     * @type {import("../coordinate.js").Coordinate}
     * @private
     */
    private topRight_;
    /**
     * @type {Array<GraticuleLabelDataType>}
     * @private
     */
    private meridiansLabels_;
    /**
     * @type {Array<GraticuleLabelDataType>}
     * @private
     */
    private parallelsLabels_;
    /**
     * @type {null|function(number):string}
     * @private
     */
    private lonLabelFormatter_;
    /**
     * @type {function(number):string}
     * @private
     */
    private latLabelFormatter_;
    /**
     * Longitude label position in fractions (0..1) of view extent. 0 means
     * bottom, 1 means top.
     * @type {number}
     * @private
     */
    private lonLabelPosition_;
    /**
     * Latitude Label position in fractions (0..1) of view extent. 0 means left, 1
     * means right.
     * @type {number}
     * @private
     */
    private latLabelPosition_;
    /**
     * @type {Style}
     * @private
     */
    private lonLabelStyleBase_;
    /**
     * @private
     * @param {import("../Feature").default} feature Feature
     * @return {Style} style
     */
    private lonLabelStyle_;
    /**
     * @type {Style}
     * @private
     */
    private latLabelStyleBase_;
    /**
     * @private
     * @param {import("../Feature").default} feature Feature
     * @return {Style} style
     */
    private latLabelStyle_;
    /**
     * @type {Array<number>}
     * @private
     */
    private intervals_;
    /**
     * feature pool to use when updating graticule
     * @type {Array<Feature>}
     * @private
     */
    private featurePool_;
    /**
     * @type {Style}
     * @private
     */
    private lineStyle_;
    /**
     * @type {?import("../extent.js").Extent}
     * @private
     */
    private loadedExtent_;
    /**
     * @type {?import("../extent.js").Extent}
     * @private
     */
    private renderedExtent_;
    /**
     * @type {?number}
     * @private
     */
    private renderedResolution_;
    /**
     * Strategy function for loading features based on the view's extent and
     * resolution.
     * @param {import("../extent.js").Extent} extent Extent.
     * @param {number} resolution Resolution.
     * @return {Array<import("../extent.js").Extent>} Extents.
     */
    strategyFunction(extent: Extent, resolution: number): Array<Extent>;
    /**
     * Update geometries in the source based on current view
     * @param {import("../extent").Extent} extent Extent
     * @param {number} resolution Resolution
     * @param {import("../proj/Projection.js").default} projection Projection
     */
    loaderFunction(extent: Extent, resolution: number, projection: Projection): void;
    /**
     * @param {number} lon Longitude.
     * @param {number} minLat Minimal latitude.
     * @param {number} maxLat Maximal latitude.
     * @param {number} squaredTolerance Squared tolerance.
     * @param {import("../extent.js").Extent} extent Extent.
     * @param {number} index Index.
     * @return {number} Index.
     * @private
     */
    private addMeridian_;
    /**
     * @param {number} lat Latitude.
     * @param {number} minLon Minimal longitude.
     * @param {number} maxLon Maximal longitude.
     * @param {number} squaredTolerance Squared tolerance.
     * @param {import("../extent.js").Extent} extent Extent.
     * @param {number} index Index.
     * @return {number} Index.
     * @private
     */
    private addParallel_;
    /**
     * @param {import("../render/Event.js").default} event Render event.
     * @private
     */
    private drawLabels_;
    /**
     * @param {import("../extent.js").Extent} extent Extent.
     * @param {import("../coordinate.js").Coordinate} center Center.
     * @param {number} resolution Resolution.
     * @param {number} squaredTolerance Squared tolerance.
     * @private
     */
    private createGraticule_;
    /**
     * @param {number} resolution Resolution.
     * @return {number} The interval in degrees.
     * @private
     */
    private getInterval_;
    /**
     * @param {number} lon Longitude.
     * @param {number} minLat Minimal latitude.
     * @param {number} maxLat Maximal latitude.
     * @param {number} squaredTolerance Squared tolerance.
     * @return {LineString} The meridian line string.
     * @param {number} index Index.
     * @private
     */
    private getMeridian_;
    /**
     * @param {LineString} lineString Meridian
     * @param {import("../extent.js").Extent} extent Extent.
     * @param {number} index Index.
     * @return {Point} Meridian point.
     * @private
     */
    private getMeridianPoint_;
    /**
     * Get the list of meridians.  Meridians are lines of equal longitude.
     * @return {Array<LineString>} The meridians.
     * @api
     */
    getMeridians(): Array<LineString>;
    /**
     * @param {number} lat Latitude.
     * @param {number} minLon Minimal longitude.
     * @param {number} maxLon Maximal longitude.
     * @param {number} squaredTolerance Squared tolerance.
     * @return {LineString} The parallel line string.
     * @param {number} index Index.
     * @private
     */
    private getParallel_;
    /**
     * @param {LineString} lineString Parallels.
     * @param {import("../extent.js").Extent} extent Extent.
     * @param {number} index Index.
     * @return {Point} Parallel point.
     * @private
     */
    private getParallelPoint_;
    /**
     * Get the list of parallels.  Parallels are lines of equal latitude.
     * @return {Array<LineString>} The parallels.
     * @api
     */
    getParallels(): Array<LineString>;
    /**
     * @param {import("../proj/Projection.js").default} projection Projection.
     * @private
     */
    private updateProjectionInfo_;
}

type WeightExpression = NumberExpression | string | ((arg0: Feature$1) => number);
type Options$8<FeatureType extends FeatureLike = Feature$1<Geometry>, VectorSourceType extends VectorSource<FeatureType> = VectorSource<FeatureType>> = {
    /**
     * A CSS class name to set to the layer element.
     */
    className?: string | undefined;
    /**
     * Opacity (0, 1).
     */
    opacity?: number | undefined;
    /**
     * Visibility.
     */
    visible?: boolean | undefined;
    /**
     * The bounding extent for layer rendering.  The layer will not be
     * rendered outside of this extent.
     */
    extent?: Extent | undefined;
    /**
     * The z-index for layer rendering.  At rendering time, the layers
     * will be ordered, first by Z-index and then by position. When `undefined`, a `zIndex` of 0 is assumed
     * for layers that are added to the map's `layers` collection, or `Infinity` when the layer's `setMap()`
     * method was used.
     */
    zIndex?: number | undefined;
    /**
     * The minimum resolution (inclusive) at which this layer will be
     * visible.
     */
    minResolution?: number | undefined;
    /**
     * The maximum resolution (exclusive) below which this layer will
     * be visible.
     */
    maxResolution?: number | undefined;
    /**
     * The minimum view zoom level (exclusive) above which this layer will be
     * visible.
     */
    minZoom?: number | undefined;
    /**
     * The maximum view zoom level (inclusive) at which this layer will
     * be visible.
     */
    maxZoom?: number | undefined;
    /**
     * The color gradient
     * of the heatmap, specified as an array of CSS color strings.
     */
    gradient?: string[] | undefined;
    /**
     * Radius size in pixels. Note that for LineStrings,
     * the width of the line will be double the radius.
     */
    radius?: NumberExpression | undefined;
    /**
     * Blur size in pixels. This is added to the `radius`
     * parameter above to create the final size of the blur effect.
     */
    blur?: NumberExpression | undefined;
    /**
     * The feature
     * attribute to use for the weight. This also supports expressions returning a number or a function that returns a weight from a feature. Weight values
     * should range from 0 to 1 (and values outside will be clamped to that range).
     */
    weight?: WeightExpression | undefined;
    /**
     * Optional filter expression.
     */
    filter?: BooleanExpression | undefined;
    /**
     * Variables used in expressions (optional)
     */
    variables?: {
        [x: string]: string | number | boolean | number[];
    } | undefined;
    /**
     * Point source.
     */
    source?: VectorSourceType | undefined;
    /**
     * Arbitrary observable properties. Can be accessed with `#get()` and `#set()`.
     */
    properties?: {
        [x: string]: any;
    } | undefined;
};
/**
 * @classdesc
 * Layer for rendering vector data as a heatmap.
 * Note that any property set in the options is set as a {@link module:ol/Object~BaseObject}
 * property on the layer object; for example, setting `title: 'My Title'` in the
 * options means that `title` is observable, and has get/set accessors.
 *
 * @fires import("../render/Event.js").RenderEvent#prerender
 * @fires import("../render/Event.js").RenderEvent#postrender
 * @template {import("../Feature.js").FeatureLike} [FeatureType=import("../Feature.js").default]
 * @template {import("../source/Vector.js").default<FeatureType>} [VectorSourceType=import("../source/Vector.js").default<FeatureType>]
 * @extends {BaseVector<FeatureType, VectorSourceType, WebGLVectorLayerRenderer>}
 * @api
 */
declare class Heatmap<FeatureType extends FeatureLike = Feature$1<Geometry>, VectorSourceType extends VectorSource<FeatureType> = VectorSource<FeatureType>> extends BaseVectorLayer<FeatureType, VectorSourceType, WebGLVectorLayerRenderer> {
    /**
     * @param {Options<FeatureType, VectorSourceType>} [options] Options.
     */
    constructor(options?: Options$8<FeatureType, VectorSourceType>);
    filter_: BooleanExpression;
    /**
     * @type {import('../style/flat.js').StyleVariables}
     * @private
     */
    private styleVariables_;
    /**
     * @private
     * @type {HTMLCanvasElement|OffscreenCanvas}
     */
    private gradient_;
    /**
     * @private
     */
    private weight_;
    /**
     * Return the blur size in pixels.
     * @return {import("../style/flat.js").NumberExpression} Blur size in pixels.
     * @api
     * @observable
     */
    getBlur(): NumberExpression;
    /**
     * Return the gradient colors as array of strings.
     * @return {Array<string>} Colors.
     * @api
     * @observable
     */
    getGradient(): Array<string>;
    /**
     * Return the size of the radius in pixels.
     * @return {import("../style/flat.js").NumberExpression} Radius size in pixel.
     * @api
     * @observable
     */
    getRadius(): NumberExpression;
    /**
     * @private
     */
    private handleGradientChanged_;
    /**
     * Set the blur size in pixels.
     * @param {import("../style/flat.js").NumberExpression} blur Blur size in pixels (supports expressions).
     * @api
     * @observable
     */
    setBlur(blur: NumberExpression): void;
    /**
     * Set the gradient colors as array of strings.
     * @param {Array<string>} colors Gradient.
     * @api
     * @observable
     */
    setGradient(colors: Array<string>): void;
    /**
     * Set the size of the radius in pixels.
     * @param {import("../style/flat.js").NumberExpression} radius Radius size in pixel (supports expressions).
     * @api
     * @observable
     */
    setRadius(radius: NumberExpression): void;
    /**
     * Set the filter expression
     * @param {import("../style/flat.js").BooleanExpression} filter Filter expression
     * @api
     */
    setFilter(filter: BooleanExpression): void;
    /**
     * Set the weight expression
     * @param {WeightExpression} weight Weight expression
     * @api
     */
    setWeight(weight: WeightExpression): void;
    /**
     * Update any variables used by the layer style and trigger a re-render.
     * @param {import('../style/flat.js').StyleVariables} variables Variables to update.
     */
    updateStyleVariables(variables: StyleVariables): void;
    /**
     * @override
     */
    override renderDeclutter(): void;
}

type Options$7<VectorSourceType extends VectorSource<FeatureLike>> = {
    /**
     * Literal style to apply to the layer features.
     */
    style: FlatStyle;
    /**
     * The filter used
     * to determine if a style applies. If no filter is included, the rule always applies.
     */
    filter?: EncodedExpression | undefined;
    /**
     * Style variables. Each variable must hold a literal value (not
     * an expression). These variables can be used as {@link import ("../expr/expression.js").ExpressionValue expressions} in the styles properties
     * using the `['var', 'varName']` operator.
     * To update style variables, use the {@link import ("./WebGLPoints.js").default#updateStyleVariables} method.
     */
    variables?: {
        [x: string]: string | number | boolean | number[];
    } | undefined;
    /**
     * A CSS class name to set to the layer element.
     */
    className?: string | undefined;
    /**
     * Opacity (0, 1).
     */
    opacity?: number | undefined;
    /**
     * Visibility.
     */
    visible?: boolean | undefined;
    /**
     * The bounding extent for layer rendering.  The layer will not be
     * rendered outside of this extent.
     */
    extent?: Extent | undefined;
    /**
     * The z-index for layer rendering.  At rendering time, the layers
     * will be ordered, first by Z-index and then by position. When `undefined`, a `zIndex` of 0 is assumed
     * for layers that are added to the map's `layers` collection, or `Infinity` when the layer's `setMap()`
     * method was used.
     */
    zIndex?: number | undefined;
    /**
     * The minimum resolution (inclusive) at which this layer will be
     * visible.
     */
    minResolution?: number | undefined;
    /**
     * The maximum resolution (exclusive) below which this layer will
     * be visible.
     */
    maxResolution?: number | undefined;
    /**
     * The minimum view zoom level (exclusive) above which this layer will be
     * visible.
     */
    minZoom?: number | undefined;
    /**
     * The maximum view zoom level (inclusive) at which this layer will
     * be visible.
     */
    maxZoom?: number | undefined;
    /**
     * Point source.
     */
    source?: VectorSourceType | undefined;
    /**
     * Setting this to true will provide a slight performance boost, but will
     * prevent all hit detection on the layer.
     */
    disableHitDetection?: boolean | undefined;
    /**
     * Arbitrary observable properties. Can be accessed with `#get()` and `#set()`.
     */
    properties?: {
        [x: string]: any;
    } | undefined;
};
/**
 * @template {import("../source/Vector.js").default<import('../Feature').FeatureLike>} VectorSourceType
 * @typedef {Object} Options
 * @property {import('../style/flat.js').FlatStyle} style Literal style to apply to the layer features.
 * @property {import("../expr/expression.js").EncodedExpression} [filter] The filter used
 * to determine if a style applies. If no filter is included, the rule always applies.
 * @property {import('../style/flat.js').StyleVariables} [variables] Style variables. Each variable must hold a literal value (not
 * an expression). These variables can be used as {@link import("../expr/expression.js").ExpressionValue expressions} in the styles properties
 * using the `['var', 'varName']` operator.
 * To update style variables, use the {@link import("./WebGLPoints.js").default#updateStyleVariables} method.
 * @property {string} [className='ol-layer'] A CSS class name to set to the layer element.
 * @property {number} [opacity=1] Opacity (0, 1).
 * @property {boolean} [visible=true] Visibility.
 * @property {import("../extent.js").Extent} [extent] The bounding extent for layer rendering.  The layer will not be
 * rendered outside of this extent.
 * @property {number} [zIndex] The z-index for layer rendering.  At rendering time, the layers
 * will be ordered, first by Z-index and then by position. When `undefined`, a `zIndex` of 0 is assumed
 * for layers that are added to the map's `layers` collection, or `Infinity` when the layer's `setMap()`
 * method was used.
 * @property {number} [minResolution] The minimum resolution (inclusive) at which this layer will be
 * visible.
 * @property {number} [maxResolution] The maximum resolution (exclusive) below which this layer will
 * be visible.
 * @property {number} [minZoom] The minimum view zoom level (exclusive) above which this layer will be
 * visible.
 * @property {number} [maxZoom] The maximum view zoom level (inclusive) at which this layer will
 * be visible.
 * @property {VectorSourceType} [source] Point source.
 * @property {boolean} [disableHitDetection=false] Setting this to true will provide a slight performance boost, but will
 * prevent all hit detection on the layer.
 * @property {Object<string, *>} [properties] Arbitrary observable properties. Can be accessed with `#get()` and `#set()`.
 */
/**
 * @classdesc
 * Layer optimized for rendering large point datasets. Takes a `style` property which
 * is a serializable JSON object describing how the layer should be rendered.
 *
 * Here are a few samples of literal style objects:
 * ```js
 * const style = {
 *   'circle-radius': 8,
 *   'circle-fill-color': '#33AAFF',
 *   'circle-opacity': 0.9
 * }
 * ```
 *
 * ```js
 * const style = {
 *   'icon-src': '../static/exclamation-mark.png',
 *   'icon-offset': [0, 12],
 *   'icon-width': 4,
 *   'icon-height': 8
 * }
 * ```
 *
 * **Important: a `WebGLPoints` layer must be manually disposed when removed, otherwise the underlying WebGL context
 * will not be garbage collected.**
 *
 * Note that any property set in the options is set as a {@link module:ol/Object~BaseObject}
 * property on the layer object; for example, setting `title: 'My Title'` in the
 * options means that `title` is observable, and has get/set accessors.
 *
 * @template {import("../source/Vector.js").default<import('../Feature').FeatureLike>} VectorSourceType
 * @extends {Layer<VectorSourceType, WebGLPointsLayerRenderer>}
 * @fires import("../render/Event.js").RenderEvent#prerender
 * @fires import("../render/Event.js").RenderEvent#postrender
 * @deprecated Use ol/layer/WebGLVector instead
 */
declare class WebGLPointsLayer<VectorSourceType extends VectorSource<FeatureLike>> extends Layer<VectorSourceType, WebGLPointsLayerRenderer> {
    /**
     * @param {Options<VectorSourceType>} options Options.
     */
    constructor(options: Options$7<VectorSourceType>);
    /**
     * @type {import('../style/flat.js').StyleVariables}
     * @private
     */
    private styleVariables_;
    /**
     * @private
     * @type {import('../render/webgl/style.js').StyleParseResult}
     */
    private parseResult_;
    /**
     * @private
     * @type {boolean}
     */
    private hitDetectionDisabled_;
    /**
     * Update any variables used by the layer style and trigger a re-render.
     * @param {Object<string, number>} variables Variables to update.
     */
    updateStyleVariables(variables: {
        [x: string]: number;
    }): void;
}

/**
 * @module ol/webgl/PaletteTexture
 */
declare class PaletteTexture {
    /**
     * @param {string} name The name of the texture.
     * @param {Uint8Array} data The texture data.
     */
    constructor(name: string, data: Uint8Array);
    name: string;
    data: Uint8Array<ArrayBufferLike>;
    /**
     * @type {WebGLTexture|null}
     * @private
     */
    private texture_;
    /**
     * @param {WebGLRenderingContext} gl Rendering context.
     * @return {WebGLTexture} The texture.
     */
    getTexture(gl: WebGLRenderingContext): WebGLTexture;
    /**
     * @param {WebGLRenderingContext} gl Rendering context.
     */
    delete(gl: WebGLRenderingContext): void;
}
//# sourceMappingURL=PaletteTexture.d.ts.map

type LayerType = FlowLayer;
type Options$6 = {
    /**
     * The maximum particle speed in the input data.
     */
    maxSpeed: number;
    /**
     * A larger factor increases the rate at which particles cross the screen.
     */
    speedFactor?: number | undefined;
    /**
     * The number of particles to render.
     */
    particles?: number | undefined;
    /**
     * The texture cache size.
     */
    cacheSize?: number | undefined;
    /**
     * The flow tile vertex shader.
     */
    tileVertexShader: string;
    /**
     * The flow tile fragment shader.
     */
    tileFragmentShader: string;
    /**
     * Generic texture fragment shader.
     */
    textureVertexShader: string;
    /**
     * Generic texture fragment shader.
     */
    textureFragmentShader: string;
    /**
     * The particle position vertex shader.
     */
    particlePositionVertexShader: string;
    /**
     * The particle position fragment shader.
     */
    particlePositionFragmentShader: string;
    /**
     * The particle color vertex shader.
     */
    particleColorVertexShader: string;
    /**
     * The particle color fragment shader.
     */
    particleColorFragmentShader: string;
};
/**
 * @classdesc
 * Experimental WebGL renderer for vector fields.
 * @extends {WebGLTileLayerRenderer<LayerType>}
 */
declare class FlowLayerRenderer extends WebGLTileLayerRenderer<FlowLayer> {
    /**
     * @param {LayerType} layer The tiled field layer.
     * @param {Options} options The renderer options.
     */
    constructor(layer: LayerType, options: Options$6);
    /**
     * @type {string}
     * @private
     */
    private particleColorFragmentShader_;
    /**
     * @type {WebGLTexture|null}
     * @private
     */
    private velocityTexture_;
    /**
     * @type {number}
     * @private
     */
    private particleCountSqrt_;
    /**
     * @type {WebGLArrayBuffer}
     * @private
     */
    private particleIndexBuffer_;
    /**
     * @type {WebGLArrayBuffer}
     * @private
     */
    private quadBuffer_;
    /**
     * @type {WebGLProgram}
     * @private
     */
    private particlePositionProgram_;
    /**
     * @type {string}
     * @private
     */
    private particlePositionVertexShader_;
    /**
     * @type {string}
     * @private
     */
    private particlePositionFragmentShader_;
    /**
     * @type {WebGLTexture}
     * @private
     */
    private previousPositionTexture_;
    /**
     * @type {WebGLTexture}
     * @private
     */
    private nextPositionTexture_;
    /**
     * @type {WebGLProgram}
     * @private
     */
    private particleColorProgram_;
    /**
     * @type {string}
     * @private
     */
    private particleColorVertexShader_;
    /**
     * @type {WebGLProgram}
     * @private
     */
    private textureProgram_;
    /**
     * @type {string}
     * @private
     */
    private textureVertexShader_;
    /**
     * @type {string}
     * @private
     */
    private textureFragmentShader_;
    /**
     * @type {WebGLTexture}
     * @private
     */
    private previousTrailsTexture_;
    /**
     * @type {WebGLTexture}
     * @private
     */
    private nextTrailsTexture_;
    /**
     * @type {number}
     * @private
     */
    private fadeOpacity_;
    /**
     * @type {number}
     * @private
     */
    private maxSpeed_;
    /**
     * @type {number}
     * @private
     */
    private speedFactor_;
    /**
     * @type {number}
     * @private
     */
    private dropRate_;
    /**
     * @type {number}
     * @private
     */
    private dropRateBump_;
    /**
     * @type {Array<number>}
     * @private
     */
    private tempVec2_;
    /**
     * @type {number}
     * @private
     */
    private renderedWidth_;
    /**
     * @type {number}
     * @private
     */
    private renderedHeight_;
    framebuffer_: WebGLFramebuffer | undefined;
    createSizeDependentTextures_(): void;
    /**
     * @param {import("../../Map.js").FrameState} frameState Frame state.
     */
    drawParticleTrails_(frameState: FrameState): void;
    /**
     * @param {WebGLTexture} texture The texture to draw.
     * @param {number} opacity The opacity.
     */
    drawTexture_(texture: WebGLTexture, opacity: number): void;
    /**
     * @param {import("../../Map.js").FrameState} frameState Frame state.
     */
    drawParticleColor_(frameState: FrameState): void;
    /**
     * @param {import("../../Map.js").FrameState} frameState Frame state.
     */
    updateParticlePositions_(frameState: FrameState): void;
}

type SourceType$1 = DataTileSource;
/**
 * Translates tile data to rendered pixels.
 */
type Style$1 = {
    /**
     * Style variables.  Each variable must hold a number or string.  These
     * variables can be used in the `color` {@link import ("../expr/expression.js").ExpressionValue expression} using
     * the `['var', 'varName']` operator.  To update style variables, use the {@link import ("./WebGLTile.js").default#updateStyleVariables} method.
     */
    variables?: {
        [x: string]: string | number;
    } | undefined;
    /**
     * An expression applied to color values.
     */
    color?: ExpressionValue | undefined;
};
type Options$5 = {
    /**
     * The maximum particle speed.
     */
    maxSpeed: number;
    /**
     * A larger factor increases the rate at which particles cross the screen.
     */
    speedFactor?: number | undefined;
    /**
     * The number of particles to render.
     */
    particles?: number | undefined;
    /**
     * Style to apply to the layer.
     */
    style?: Style$1 | undefined;
    /**
     * A CSS class name to set to the layer element.
     */
    className?: string | undefined;
    /**
     * Opacity (0, 1).
     */
    opacity?: number | undefined;
    /**
     * Visibility.
     */
    visible?: boolean | undefined;
    /**
     * The bounding extent for layer rendering.  The layer will not be
     * rendered outside of this extent.
     */
    extent?: Extent | undefined;
    /**
     * The z-index for layer rendering.  At rendering time, the layers
     * will be ordered, first by Z-index and then by position. When `undefined`, a `zIndex` of 0 is assumed
     * for layers that are added to the map's `layers` collection, or `Infinity` when the layer's `setMap()`
     * method was used.
     */
    zIndex?: number | undefined;
    /**
     * The minimum resolution (inclusive) at which this layer will be
     * visible.
     */
    minResolution?: number | undefined;
    /**
     * The maximum resolution (exclusive) below which this layer will
     * be visible.
     */
    maxResolution?: number | undefined;
    /**
     * The minimum view zoom level (exclusive) above which this layer will be
     * visible.
     */
    minZoom?: number | undefined;
    /**
     * The maximum view zoom level (inclusive) at which this layer will
     * be visible.
     */
    maxZoom?: number | undefined;
    /**
     * Preload. Load low-resolution tiles up to `preload` levels. `0`
     * means no preloading.
     */
    preload?: number | undefined;
    /**
     * Source for this layer.
     */
    source?: DataTileSource<DataTile> | undefined;
    /**
     * Sets the layer as overlay on a map. The map will not manage
     * this layer in its layers collection, and the layer will be rendered on top. This is useful for
     * temporary layers. The standard way to add a layer to a map and have it managed by the map is to
     * use {@link module :ol/Map~Map#addLayer}.
     */
    map?: Map | undefined;
    /**
     * Use interim tiles on error.
     */
    useInterimTilesOnError?: boolean | undefined;
    /**
     * The internal texture cache size.  This needs to be large enough to render
     * two zoom levels worth of tiles.
     */
    cacheSize?: number | undefined;
};
/**
 * @classdesc
 * Experimental layer that renders particles moving through a vector field.
 *
 * @extends BaseTileLayer<SourceType, FlowLayerRenderer>
 * @fires import("../render/Event.js").RenderEvent#prerender
 * @fires import("../render/Event.js").RenderEvent#postrender
 */
declare class FlowLayer extends BaseTileLayer<DataTileSource<DataTile>, FlowLayerRenderer> {
    /**
     * @param {Options} options Flow layer options.
     */
    constructor(options: Options$5);
    /**
     * @type {Style}
     * @private
     */
    private style_;
    /**
     * @type {number}
     * @private
     */
    private maxSpeed_;
    /**
     * @type {number}
     * @private
     */
    private speedFactor_;
    /**
     * @type {number}
     * @private
     */
    private particles_;
    /**
     * @type {Object<string, (string|number)>}
     * @private
     */
    private styleVariables_;
    /**
     * @private
     */
    private handleSourceUpdate_;
    /**
     * Update any variables used by the layer style and trigger a re-render.
     * @param {Object<string, number>} variables Variables to update.
     */
    updateStyleVariables(variables: {
        [x: string]: number;
    }): void;
    /**
     * Gets the sources for this layer, for a given extent and resolution.
     * @param {import("../extent.js").Extent} extent Extent.
     * @param {number} resolution Resolution.
     * @return {Array<SourceType>} Sources.
     */
    getSources(extent: Extent, resolution: number): Array<SourceType$1>;
}

type BaseTileType = Tile;
type TileRepresentationOptions<TileType extends BaseTileType> = {
    /**
     * The tile.
     */
    tile: TileType;
    /**
     * Tile grid.
     */
    grid: TileGrid;
    /**
     * WebGL helper.
     */
    helper: WebGLHelper;
    /**
     * The size in pixels of the gutter around image tiles to ignore.
     */
    gutter?: number | undefined;
};
/**
 * @typedef {import("../Tile.js").default} BaseTileType
 */
/**
 * @template {BaseTileType} TileType
 * @typedef {Object} TileRepresentationOptions
 * @property {TileType} tile The tile.
 * @property {import("../tilegrid/TileGrid.js").default} grid Tile grid.
 * @property {import("../webgl/Helper.js").default} helper WebGL helper.
 * @property {number} [gutter=0] The size in pixels of the gutter around image tiles to ignore.
 */
/**
 * @classdesc
 * Base class for representing a tile in a webgl context
 * @template {import("../Tile.js").default} TileType
 * @abstract
 */
declare class BaseTileRepresentation<TileType extends Tile> extends Target {
    /**
     * @param {TileRepresentationOptions<TileType>} options The tile representation options.
     */
    constructor(options: TileRepresentationOptions<TileType>);
    /**
     * @type {TileType}
     */
    tile: TileType;
    handleTileChange_(): void;
    /**
     * @type {number}
     * @protected
     */
    protected gutter: number;
    /**
     * @type {import("../webgl/Helper.js").default}
     * @protected
     */
    protected helper: WebGLHelper;
    loaded: boolean;
    ready: boolean;
    /**
     * @param {TileType} tile Tile.
     */
    setTile(tile: TileType): void;
    /**
     * @abstract
     * @protected
     */
    protected uploadTile(): void;
    setReady(): void;
    /**
     * @param {import("./Helper.js").default} helper The WebGL helper.
     */
    setHelper(helper: WebGLHelper): void;
}

type TileType = DataTile | ImageTile | ReprojTile;
/**
 * @typedef {import("../DataTile.js").default|ImageTile|ReprojTile} TileType
 */
/**
 * @extends {BaseTileRepresentation<TileType>}
 */
declare class TileTexture extends BaseTileRepresentation<TileType> {
    /**
     * @param {import("./BaseTileRepresentation.js").TileRepresentationOptions<TileType>} options The tile texture options.
     */
    constructor(options: TileRepresentationOptions<TileType>);
    /**
     * @type {Array<WebGLTexture>}
     */
    textures: Array<WebGLTexture>;
    /**
     * @type {import("../size.js").Size}
     * @private
     */
    private renderSize_;
    /**
     * @type {number}
     */
    bandCount: number;
    /**
     * @type {WebGLArrayBuffer}
     */
    coords: WebGLArrayBuffer;
    /**
     * @param {import("../DataTile.js").ImageLike} image The image.
     * @param {number} renderCol The column index (in rendered tile space).
     * @param {number} renderRow The row index (in rendered tile space).
     * @return {Uint8ClampedArray|null} The data.
     * @private
     */
    private getImagePixelData_;
    /**
     * @param {import("../DataTile.js").ArrayLike} data The data.
     * @param {import("../size.js").Size} sourceSize The size.
     * @param {number} renderCol The column index (in rendered tile space).
     * @param {number} renderRow The row index (in rendered tile space).
     * @return {import("../DataTile.js").ArrayLike|null} The data.
     * @private
     */
    private getArrayPixelData_;
    /**
     * Get data for a pixel.  If the tile is not loaded, null is returned.
     * @param {number} renderCol The column index (in rendered tile space).
     * @param {number} renderRow The row index (in rendered tile space).
     * @return {import("../DataTile.js").ArrayLike|null} The data.
     */
    getPixelData(renderCol: number, renderRow: number): ArrayLike | null;
}

type TileRepresentationLookup = {
    /**
     * The set of tile ids in the lookup.
     */
    tileIds: Set<string>;
    /**
     * Tile representations by zoom level.
     */
    representationsByZ: {
        [x: number]: Set<BaseTileRepresentation<Tile>>;
    };
};
type Options$4 = {
    /**
     * Additional uniforms
     * made available to shaders.
     */
    uniforms?: {
        [x: string]: UniformValue;
    } | undefined;
    /**
     * The tile representation cache size.
     */
    cacheSize?: number | undefined;
    /**
     * Post-processes definitions.
     */
    postProcesses?: PostProcessesOptions[] | undefined;
};
type BaseLayerType = BaseTileLayer<any, any>;
/**
 * @typedef {Object} Options
 * @property {Object<string, import("../../webgl/Helper").UniformValue>} [uniforms] Additional uniforms
 * made available to shaders.
 * @property {number} [cacheSize=512] The tile representation cache size.
 * @property {Array<import('./Layer.js').PostProcessesOptions>} [postProcesses] Post-processes definitions.
 */
/**
 * @typedef {import("../../layer/BaseTile.js").default} BaseLayerType
 */
/**
 * @classdesc
 * Base WebGL renderer for tile layers.
 * @template {BaseLayerType} LayerType
 * @template {import("../../Tile.js").default} TileType
 * @template {import("../../webgl/BaseTileRepresentation.js").default<TileType>} TileRepresentation
 * @extends {WebGLLayerRenderer<LayerType>}
 */
declare class WebGLBaseTileLayerRenderer<LayerType extends BaseLayerType, TileType extends Tile, TileRepresentation extends BaseTileRepresentation<TileType>> extends WebGLLayerRenderer<LayerType> {
    /**
     * @param {LayerType} tileLayer Tile layer.
     * @param {Options} options Options.
     */
    constructor(tileLayer: LayerType, options: Options$4);
    /**
     * The last call to `renderFrame` was completed with all tiles loaded
     * @type {boolean}
     */
    renderComplete: boolean;
    /**
     * This transform converts representation coordinates to screen coordinates.
     * @type {import("../../transform.js").Transform}
     * @private
     */
    private tileTransform_;
    /**
     * @type {Array<number>}
     * @protected
     */
    protected tempMat4: Array<number>;
    /**
     * @type {import("../../TileRange.js").default}
     * @private
     */
    private tempTileRange_;
    /**
     * @type {import("../../tilecoord.js").TileCoord}
     * @private
     */
    private tempTileCoord_;
    /**
     * @type {import("../../size.js").Size}
     * @private
     */
    private tempSize_;
    /**
     * @type {import("../../structs/LRUCache.js").default<TileRepresentation>}
     * @protected
     */
    protected tileRepresentationCache: LRUCache<TileRepresentation>;
    /**
     * @protected
     * @type {import("../../Map.js").FrameState|null}
     */
    protected frameState: FrameState | null;
    /**
     * @private
     * @type {import("../../proj/Projection.js").default}
     */
    private renderedProjection_;
    /**
     * @param {Options} options Options.
     * @override
     */
    override reset(options: Options$4): void;
    /**
     * @abstract
     * @param {import("../../webgl/BaseTileRepresentation.js").TileRepresentationOptions<TileType>} options tile representation options
     * @return {TileRepresentation} A new tile representation
     * @protected
     */
    protected createTileRepresentation(options: TileRepresentationOptions<TileType>): TileRepresentation;
    /**
     * @param {import("../../Map.js").FrameState} frameState Frame state.
     * @param {import("../../extent.js").Extent} extent The extent to be rendered.
     * @param {number} initialZ The zoom level.
     * @param {TileRepresentationLookup} tileRepresentationLookup The zoom level.
     * @param {number} preload Number of additional levels to load.
     */
    enqueueTiles(frameState: FrameState, extent: Extent, initialZ: number, tileRepresentationLookup: TileRepresentationLookup, preload: number): void;
    /**
     * @param {import("../../Map.js").FrameState} frameState Frame state.
     * @param {boolean} tilesWithAlpha True if at least one of the rendered tiles has alpha
     * @protected
     */
    protected beforeTilesRender(frameState: FrameState, tilesWithAlpha: boolean): void;
    /**
     * @param {import("../../Map.js").FrameState} frameState Frame state.
     * @return {boolean} If returns false, tile mask rendering will be skipped
     * @protected
     */
    protected beforeTilesMaskRender(frameState: FrameState): boolean;
    /**
     * @param {TileRepresentation} tileRepresentation Tile representation
     * @param {import("../../transform.js").Transform} tileTransform Tile transform
     * @param {import("../../Map.js").FrameState} frameState Frame state
     * @param {import("../../extent.js").Extent} renderExtent Render extent
     * @param {number} tileResolution Tile resolution
     * @param {import("../../size.js").Size} tileSize Tile size
     * @param {import("../../coordinate.js").Coordinate} tileOrigin Tile origin
     * @param {import("../../extent.js").Extent} tileExtent tile Extent
     * @param {number} depth Depth
     * @param {number} gutter Gutter
     * @param {number} alpha Alpha
     * @protected
     */
    protected renderTile(tileRepresentation: TileRepresentation, tileTransform: Transform, frameState: FrameState, renderExtent: Extent, tileResolution: number, tileSize: Size, tileOrigin: Coordinate, tileExtent: Extent, depth: number, gutter: number, alpha: number): void;
    /**
     * @param {TileRepresentation} tileRepresentation Tile representation
     * @param {number} tileZ Tile Z
     * @param {import("../../extent.js").Extent} extent Render extent
     * @param {number} depth Depth
     * @protected
     */
    protected renderTileMask(tileRepresentation: TileRepresentation, tileZ: number, extent: Extent, depth: number): void;
    drawTile_(frameState: any, tileRepresentation: any, tileZ: any, gutter: any, extent: any, alphaLookup: any, tileGrid: any): void;
    /**
     * Render the layer.
     * @param {import("../../Map.js").FrameState} frameState Frame state.
     * @return {HTMLElement} The rendered element.
     * @override
     */
    override renderFrame(frameState: FrameState): HTMLElement;
    /**
     * @param {import("../../Map.js").FrameState} frameState Frame state.
     * @protected
     */
    protected beforeFinalize(frameState: FrameState): void;
    /**
     * Look for tiles covering the provided tile coordinate at an alternate
     * zoom level.  Loaded tiles will be added to the provided tile representation lookup.
     * @param {import("../../tilegrid/TileGrid.js").default} tileGrid The tile grid.
     * @param {import("../../tilecoord.js").TileCoord} tileCoord The target tile coordinate.
     * @param {number} altZ The alternate zoom level.
     * @param {TileRepresentationLookup} tileRepresentationLookup Lookup of
     * tile representations by zoom level.
     * @return {boolean} The tile coordinate is covered by loaded tiles at the alternate zoom level.
     * @private
     */
    private findAltTiles_;
}

type Options$3 = {
    /**
     * Vertex shader source.
     */
    vertexShader: string;
    /**
     * Fragment shader source.
     */
    fragmentShader: string;
    /**
     * Additional uniforms
     * made available to shaders.
     */
    uniforms?: {
        [x: string]: UniformValue;
    } | undefined;
    /**
     * Palette textures.
     */
    paletteTextures?: PaletteTexture[] | undefined;
    /**
     * The texture cache size.
     */
    cacheSize?: number | undefined;
    /**
     * Post-processes definitions.
     */
    postProcesses?: PostProcessesOptions[] | undefined;
};
/**
 * @typedef {Object} Options
 * @property {string} vertexShader Vertex shader source.
 * @property {string} fragmentShader Fragment shader source.
 * @property {Object<string, import("../../webgl/Helper").UniformValue>} [uniforms] Additional uniforms
 * made available to shaders.
 * @property {Array<import("../../webgl/PaletteTexture.js").default>} [paletteTextures] Palette textures.
 * @property {number} [cacheSize=512] The texture cache size.
 * @property {Array<import('./Layer.js').PostProcessesOptions>} [postProcesses] Post-processes definitions.
 */
/**
 * @typedef {import("../../webgl/TileTexture.js").TileType} TileTextureType
 */
/**
 * @typedef {import("../../webgl/TileTexture.js").default} TileTextureRepresentation
 */
/**
 * @classdesc
 * WebGL renderer for tile layers.
 * @template {import("../../layer/WebGLTile.js").default|import("../../layer/Flow.js").default} LayerType
 * @extends {WebGLBaseTileLayerRenderer<LayerType, TileTextureType, TileTextureRepresentation>}
 * @api
 */
declare class WebGLTileLayerRenderer<LayerType extends WebGLTileLayer | FlowLayer> extends WebGLBaseTileLayerRenderer<LayerType, TileType, TileTexture> {
    /**
     * @param {LayerType} tileLayer Tile layer.
     * @param {Options} options Options.
     */
    constructor(tileLayer: LayerType, options: Options$3);
    /**
     * @type {WebGLProgram}
     * @private
     */
    private program_;
    /**
     * @private
     */
    private vertexShader_;
    /**
     * @private
     */
    private fragmentShader_;
    /**
     * Tiles are rendered as a quad with the following structure:
     *
     *  [P3]---------[P2]
     *   |`           |
     *   |  `     B   |
     *   |    `       |
     *   |      `     |
     *   |   A    `   |
     *   |          ` |
     *  [P0]---------[P1]
     *
     * Triangle A: P0, P1, P3
     * Triangle B: P1, P2, P3
     *
     * @private
     */
    private indices_;
    /**
     * @type {Array<import("../../webgl/PaletteTexture.js").default>}
     * @private
     */
    private paletteTextures_;
    /**
     * @param {Options} options Options.
     * @override
     */
    override reset(options: Options$3): void;
    /**
     * @override
     */
    override createTileRepresentation(options: any): TileTexture;
    /**
     * @override
     */
    override beforeTilesRender(frameState: any, tilesWithAlpha: any): void;
    /**
     * @override
     */
    override renderTile(tileTexture: any, tileTransform: any, frameState: any, renderExtent: any, tileResolution: any, tileSize: any, tileOrigin: any, tileExtent: any, depth: any, gutter: any, alpha: any): void;
    /**
     * @param {import("../../pixel.js").Pixel} pixel Pixel.
     * @return {Uint8ClampedArray|Uint8Array|Float32Array|DataView} Data at the pixel location.
     * @override
     */
    override getData(pixel: Pixel): Uint8ClampedArray | Uint8Array | Float32Array | DataView;
}

type SourceType = DataTileSource<DataTile | ImageTile>;
/**
 * Translates tile data to rendered pixels.
 */
type Style = {
    /**
     * Style variables.  Each variable must hold a number or string.  These
     * variables can be used in the `color`, `brightness`, `contrast`, `exposure`, `saturation` and `gamma`
     * {@link import ("../expr/expression.js").ExpressionValue expressions}, using the `['var', 'varName']` operator.
     * To update style variables, use the {@link import ("./WebGLTile.js").default#updateStyleVariables} method.
     */
    variables?: {
        [x: string]: string | number;
    } | undefined;
    /**
     * An expression applied to color values.
     */
    color?: ExpressionValue | undefined;
    /**
     * Value used to decrease or increase
     * the layer brightness.  Values range from -1 to 1.
     */
    brightness?: ExpressionValue | undefined;
    /**
     * Value used to decrease or increase
     * the layer contrast.  Values range from -1 to 1.
     */
    contrast?: ExpressionValue | undefined;
    /**
     * Value used to decrease or increase
     * the layer exposure.  Values range from -1 to 1.
     */
    exposure?: ExpressionValue | undefined;
    /**
     * Value used to decrease or increase
     * the layer saturation.  Values range from -1 to 1.
     */
    saturation?: ExpressionValue | undefined;
    /**
     * Apply a gamma correction to the layer.
     * Values range from 0 to infinity.
     */
    gamma?: ExpressionValue | undefined;
};
type Options$2 = {
    /**
     * Style to apply to the layer.
     */
    style?: Style | undefined;
    /**
     * A CSS class name to set to the layer element.
     */
    className?: string | undefined;
    /**
     * Opacity (0, 1).
     */
    opacity?: number | undefined;
    /**
     * Visibility.
     */
    visible?: boolean | undefined;
    /**
     * The bounding extent for layer rendering.  The layer will not be
     * rendered outside of this extent.
     */
    extent?: Extent | undefined;
    /**
     * The z-index for layer rendering.  At rendering time, the layers
     * will be ordered, first by Z-index and then by position. When `undefined`, a `zIndex` of 0 is assumed
     * for layers that are added to the map's `layers` collection, or `Infinity` when the layer's `setMap()`
     * method was used.
     */
    zIndex?: number | undefined;
    /**
     * The minimum resolution (inclusive) at which this layer will be
     * visible.
     */
    minResolution?: number | undefined;
    /**
     * The maximum resolution (exclusive) below which this layer will
     * be visible.
     */
    maxResolution?: number | undefined;
    /**
     * The minimum view zoom level (exclusive) above which this layer will be
     * visible.
     */
    minZoom?: number | undefined;
    /**
     * The maximum view zoom level (inclusive) at which this layer will
     * be visible.
     */
    maxZoom?: number | undefined;
    /**
     * Preload. Load low-resolution tiles up to `preload` levels. `0`
     * means no preloading.
     */
    preload?: number | undefined;
    /**
     * Source for this layer.
     */
    source?: DataTileSource<ImageTile | DataTile> | undefined;
    /**
     * Array
     * of sources for this layer. Takes precedence over `source`. Can either be an array of sources, or a function that
     * expects an extent and a resolution (in view projection units per pixel) and returns an array of sources. See
     * {@link module :ol/source.sourcesFromTileGrid} for a helper function to generate sources that are organized in a
     * pyramid following the same pattern as a tile grid. **Note:** All sources must have the same band count and content.
     */
    sources?: DataTileSource<ImageTile | DataTile>[] | ((arg0: Extent, arg1: number) => Array<SourceType>) | undefined;
    /**
     * Sets the layer as overlay on a map. The map will not manage
     * this layer in its layers collection, and the layer will be rendered on top. This is useful for
     * temporary layers. The standard way to add a layer to a map and have it managed by the map is to
     * use {@link module :ol/Map~Map#addLayer}.
     */
    map?: Map | undefined;
    /**
     * Deprecated.  Use interim tiles on error.
     */
    useInterimTilesOnError?: boolean | undefined;
    /**
     * The internal texture cache size.  This needs to be large enough to render
     * two zoom levels worth of tiles.
     */
    cacheSize?: number | undefined;
    /**
     * Arbitrary observable properties. Can be accessed with `#get()` and `#set()`.
     */
    properties?: {
        [x: string]: any;
    } | undefined;
};
/**
 * @classdesc
 * For layer sources that provide pre-rendered, tiled images in grids that are
 * organized by zoom levels for specific resolutions.
 * Note that any property set in the options is set as a {@link module:ol/Object~BaseObject}
 * property on the layer object; for example, setting `title: 'My Title'` in the
 * options means that `title` is observable, and has get/set accessors.
 *
 * @extends BaseTileLayer<SourceType, WebGLTileLayerRenderer>
 * @fires import("../render/Event.js").RenderEvent#prerender
 * @fires import("../render/Event.js").RenderEvent#postrender
 * @api
 */
declare class WebGLTileLayer extends BaseTileLayer<DataTileSource<ImageTile | DataTile>, WebGLTileLayerRenderer<any>> {
    /**
     * @param {Options} [options] Tile layer options.
     */
    constructor(options?: Options$2);
    /**
     * @type {Array<SourceType>|function(import("../extent.js").Extent, number):Array<SourceType>}
     * @private
     */
    private sources_;
    /**
     * @type {SourceType|null}
     * @private
     */
    private renderedSource_;
    /**
     * @type {number}
     * @private
     */
    private renderedResolution_;
    /**
     * @type {Style}
     * @private
     */
    private style_;
    /**
     * @type {Object<string, (string|number)>}
     * @private
     */
    private styleVariables_;
    /**
     * Gets the sources for this layer, for a given extent and resolution.
     * @param {import("../extent.js").Extent} extent Extent.
     * @param {number} resolution Resolution.
     * @return {Array<SourceType>} Sources.
     */
    getSources(extent: Extent, resolution: number): Array<SourceType>;
    /**
     * @return {SourceType} The source being rendered.
     * @override
     */
    override getRenderSource(): SourceType;
    /**
     * @private
     */
    private handleSourceUpdate_;
    /**
     * @private
     * @return {number} The number of source bands.
     */
    private getSourceBandCount_;
    /**
     * @override
     */
    override createRenderer(): WebGLTileLayerRenderer<this>;
    /**
     * @param {import("../Map").FrameState} frameState Frame state.
     * @param {Array<SourceType>} sources Sources.
     * @return {HTMLElement} Canvas.
     */
    renderSources(frameState: FrameState, sources: Array<SourceType>): HTMLElement;
    /**
     * @param {?import("../Map.js").FrameState} frameState Frame state.
     * @param {HTMLElement} target Target which the renderer may (but need not) use
     * for rendering its content.
     * @return {HTMLElement} The rendered element.
     * @override
     */
    override render(frameState: FrameState | null, target: HTMLElement): HTMLElement;
    /**
     * Update the layer style.  The `updateStyleVariables` function is a more efficient
     * way to update layer rendering.  In cases where the whole style needs to be updated,
     * this method may be called instead.  Note that calling this method will also replace
     * any previously set variables, so the new style also needs to include new variables,
     * if needed.
     * @param {Style} style The new style.
     */
    setStyle(style: Style): void;
    /**
     * Update any variables used by the layer style and trigger a re-render.
     * @param {Object<string, number>} variables Variables to update.
     * @api
     */
    updateStyleVariables(variables: {
        [x: string]: number;
    }): void;
}

/**
 * *
 */
type ExtractedFeatureType<T> = T extends VectorSource<infer U extends FeatureLike> ? U : never;
type Options$1<VectorSourceType extends VectorSource<FeatureType> = VectorSource<any>, FeatureType extends FeatureLike = ExtractedFeatureType<VectorSourceType>> = {
    /**
     * A CSS class name to set to the layer element.
     */
    className?: string | undefined;
    /**
     * Opacity (0, 1).
     */
    opacity?: number | undefined;
    /**
     * Visibility.
     */
    visible?: boolean | undefined;
    /**
     * The bounding extent for layer rendering.  The layer will not be
     * rendered outside of this extent.
     * FIXME: not supported yet
     */
    extent?: Extent | undefined;
    /**
     * The z-index for layer rendering.  At rendering time, the layers
     * will be ordered, first by Z-index and then by position. When `undefined`, a `zIndex` of 0 is assumed
     * for layers that are added to the map's `layers` collection, or `Infinity` when the layer's `setMap()`
     * method was used.
     */
    zIndex?: number | undefined;
    /**
     * The minimum resolution (inclusive) at which this layer will be
     * visible.
     */
    minResolution?: number | undefined;
    /**
     * The maximum resolution (exclusive) below which this layer will
     * be visible.
     */
    maxResolution?: number | undefined;
    /**
     * The minimum view zoom level (exclusive) above which this layer will be
     * visible.
     */
    minZoom?: number | undefined;
    /**
     * The maximum view zoom level (inclusive) at which this layer will
     * be visible.
     */
    maxZoom?: number | undefined;
    /**
     * Source.
     */
    source?: VectorSourceType | undefined;
    /**
     * Layer style.
     */
    style: FlatStyleLike$1;
    /**
     * Style variables. Each variable must hold a literal value (not
     * an expression). These variables can be used as {@link import ("../expr/expression.js").ExpressionValue expressions} in the styles properties
     * using the `['var', 'varName']` operator.
     * To update style variables, use the {@link import ("./WebGLVector.js").default#updateStyleVariables} method.
     */
    variables?: {
        [x: string]: string | number | boolean | number[];
    } | undefined;
    /**
     * Background color for the layer. If not specified, no background
     * will be rendered.
     * FIXME: not supported yet
     */
    background?: BackgroundColor | undefined;
    /**
     * Setting this to true will provide a slight performance boost, but will
     * prevent all hit detection on the layer.
     */
    disableHitDetection?: boolean | undefined;
    /**
     * Arbitrary observable properties. Can be accessed with `#get()` and `#set()`.
     */
    properties?: {
        [x: string]: any;
    } | undefined;
};
/***
 * @template T
 * @typedef {T extends import("../source/Vector.js").default<infer U extends import("../Feature.js").FeatureLike> ? U : never} ExtractedFeatureType
 */
/**
 * @template {import("../source/Vector.js").default<FeatureType>} [VectorSourceType=import("../source/Vector.js").default<*>]
 * @template {import('../Feature.js').FeatureLike} [FeatureType=ExtractedFeatureType<VectorSourceType>]
 * @typedef {Object} Options
 * @property {string} [className='ol-layer'] A CSS class name to set to the layer element.
 * @property {number} [opacity=1] Opacity (0, 1).
 * @property {boolean} [visible=true] Visibility.
 * @property {import("../extent.js").Extent} [extent] The bounding extent for layer rendering.  The layer will not be
 * rendered outside of this extent.
 * FIXME: not supported yet
 * @property {number} [zIndex] The z-index for layer rendering.  At rendering time, the layers
 * will be ordered, first by Z-index and then by position. When `undefined`, a `zIndex` of 0 is assumed
 * for layers that are added to the map's `layers` collection, or `Infinity` when the layer's `setMap()`
 * method was used.
 * @property {number} [minResolution] The minimum resolution (inclusive) at which this layer will be
 * visible.
 * @property {number} [maxResolution] The maximum resolution (exclusive) below which this layer will
 * be visible.
 * @property {number} [minZoom] The minimum view zoom level (exclusive) above which this layer will be
 * visible.
 * @property {number} [maxZoom] The maximum view zoom level (inclusive) at which this layer will
 * be visible.
 * @property {VectorSourceType} [source] Source.
 * @property {import('../style/flat.js').FlatStyleLike} style Layer style.
 * @property {import('../style/flat.js').StyleVariables} [variables] Style variables. Each variable must hold a literal value (not
 * an expression). These variables can be used as {@link import("../expr/expression.js").ExpressionValue expressions} in the styles properties
 * using the `['var', 'varName']` operator.
 * To update style variables, use the {@link import("./WebGLVector.js").default#updateStyleVariables} method.
 * @property {import("./Base.js").BackgroundColor} [background] Background color for the layer. If not specified, no background
 * will be rendered.
 * FIXME: not supported yet
 * @property {boolean} [disableHitDetection=false] Setting this to true will provide a slight performance boost, but will
 * prevent all hit detection on the layer.
 * @property {Object<string, *>} [properties] Arbitrary observable properties. Can be accessed with `#get()` and `#set()`.
 */
/**
 * @classdesc
 * Layer optimized for rendering large vector datasets.
 *
 * **Important: a `WebGLVector` layer must be manually disposed when removed, otherwise the underlying WebGL context
 * will not be garbage collected.**
 *
 * Note that any property set in the options is set as a {@link module:ol/Object~BaseObject}
 * property on the layer object; for example, setting `title: 'My Title'` in the
 * options means that `title` is observable, and has get/set accessors.
 *
 * @template {import("../source/Vector.js").default<FeatureType>} [VectorSourceType=import("../source/Vector.js").default<*>]
 * @template {import('../Feature.js').FeatureLike} [FeatureType=ExtractedFeatureType<VectorSourceType>]
 * @extends {Layer<VectorSourceType, WebGLVectorLayerRenderer>}
 */
declare class WebGLVectorLayer<VectorSourceType extends VectorSource<FeatureType> = VectorSource<any>, FeatureType extends FeatureLike = ExtractedFeatureType<VectorSourceType>> extends Layer<VectorSourceType, WebGLVectorLayerRenderer> {
    /**
     * @param {Options<VectorSourceType, FeatureType>} [options] Options.
     */
    constructor(options?: Options$1<VectorSourceType, FeatureType>);
    /**
     * @type {import('../style/flat.js').StyleVariables}
     * @private
     */
    private styleVariables_;
    /**
     * @private
     */
    private style_;
    /**
     * @private
     */
    private hitDetectionDisabled_;
    /**
     * Update any variables used by the layer style and trigger a re-render.
     * @param {import('../style/flat.js').StyleVariables} variables Variables to update.
     */
    updateStyleVariables(variables: StyleVariables): void;
    /**
     * Set the layer style.
     * @param {import('../style/flat.js').FlatStyleLike} style Layer style.
     */
    setStyle(style: FlatStyleLike$1): void;
}

//# sourceMappingURL=layer.d.ts.map

type layer_d_Graticule = Graticule;
declare const layer_d_Graticule: typeof Graticule;
type layer_d_Heatmap<FeatureType extends FeatureLike = Feature$1<Geometry>, VectorSourceType extends VectorSource<FeatureType> = VectorSource<FeatureType>> = Heatmap<FeatureType, VectorSourceType>;
declare const layer_d_Heatmap: typeof Heatmap;
type layer_d_Layer<SourceType extends Source = Source, RendererType extends LayerRenderer<any> = LayerRenderer<any>> = Layer<SourceType, RendererType>;
declare const layer_d_Layer: typeof Layer;
declare namespace layer_d {
  export { layer_d_Graticule as Graticule, LayerGroup as Group, layer_d_Heatmap as Heatmap, ImageLayer as Image, layer_d_Layer as Layer, TileLayer as Tile, VectorLayer as Vector, VectorImageLayer as VectorImage, VectorTileLayer as VectorTile, WebGLPointsLayer as WebGLPoints, WebGLTileLayer as WebGLTile, WebGLVectorLayer as WebGLVector };
}

/**
 * @classdesc
 * Events emitted on [GeolocationPositionError](https://developer.mozilla.org/en-US/docs/Web/API/GeolocationPositionError).
 */
declare class GeolocationError extends BaseEvent {
    /**
     * @param {GeolocationPositionError} error error object.
     */
    constructor(error: GeolocationPositionError);
    /**
     * Code of the underlying `GeolocationPositionError`.
     * @type {number}
     * @api
     */
    code: number;
    /**
     * Message of the underlying `GeolocationPositionError`.
     * @type {string}
     * @api
     */
    message: string;
}

type Options = {
    /**
     * Start Tracking right after
     * instantiation.
     */
    tracking?: boolean | undefined;
    /**
     * Tracking options.
     * See https://www.w3.org/TR/geolocation-API/#position_options_interface.
     */
    trackingOptions?: PositionOptions | undefined;
    /**
     * The projection the position
     * is reported in.
     */
    projection?: ProjectionLike;
};
type GeolocationObjectEventTypes = Types$2 | "change:accuracy" | "change:accuracyGeometry" | "change:altitude" | "change:altitudeAccuracy" | "change:heading" | "change:position" | "change:projection" | "change:speed" | "change:tracking" | "change:trackingOptions";
/**
 * *
 */
type GeolocationOnSignature<Return> = OnSignature<GeolocationObjectEventTypes, ObjectEvent, Return> & OnSignature<"error", GeolocationError, Return> & CombinedOnSignature<EventTypes | GeolocationObjectEventTypes, Return> & OnSignature<EventTypes, BaseEvent, Return>;

/**
 * @typedef {Object} Options
 * @property {boolean} [tracking=false] Start Tracking right after
 * instantiation.
 * @property {PositionOptions} [trackingOptions] Tracking options.
 * See https://www.w3.org/TR/geolocation-API/#position_options_interface.
 * @property {import("./proj.js").ProjectionLike} [projection] The projection the position
 * is reported in.
 */
/**
 * @typedef {import("./ObjectEventType").Types|'change:accuracy'|'change:accuracyGeometry'|'change:altitude'|
 *    'change:altitudeAccuracy'|'change:heading'|'change:position'|'change:projection'|'change:speed'|'change:tracking'|
 *    'change:trackingOptions'} GeolocationObjectEventTypes
 */
/***
 * @template Return
 * @typedef {import("./Observable").OnSignature<GeolocationObjectEventTypes, import("./Object").ObjectEvent, Return> &
 *   import("./Observable").OnSignature<'error', GeolocationError, Return> &
 *   import("./Observable").CombinedOnSignature<import("./Observable").EventTypes|GeolocationObjectEventTypes, Return> &
 *   import("./Observable").OnSignature<import("./Observable").EventTypes, import("./events/Event.js").default, Return>} GeolocationOnSignature
 */
/**
 * @classdesc
 * Helper class for providing HTML5 Geolocation capabilities.
 * The [Geolocation API](https://www.w3.org/TR/geolocation-API/)
 * is used to locate a user's position.
 *
 * To get notified of position changes and errors, register listeners for the generic
 * `change` event and the `error` event on your instance of {@link module:ol/Geolocation~Geolocation}.
 *
 * Example:
 *
 *     const geolocation = new Geolocation({
 *       // take the projection to use from the map's view
 *       projection: view.getProjection()
 *     });
 *     // listen to changes in position
 *     geolocation.on('change', function(evt) {
 *       console.log(geolocation.getPosition());
 *     });
 *     // listen to error
 *     geolocation.on('error', function(evt) {
 *       window.console.log(evt.message);
 *     });
 *
 * @fires GeolocationError
 * @api
 */
declare class Geolocation extends BaseObject {
    /**
     * @param {Options} [options] Options.
     */
    constructor(options?: Options);
    /***
     * @type {GeolocationOnSignature<import("./events").EventsKey>}
     */
    on: GeolocationOnSignature<EventsKey>;
    /***
     * @type {GeolocationOnSignature<import("./events").EventsKey>}
     */
    once: GeolocationOnSignature<EventsKey>;
    /***
     * @type {GeolocationOnSignature<void>}
     */
    un: GeolocationOnSignature<void>;
    /**
     * The unprojected (EPSG:4326) device position.
     * @private
     * @type {?import("./coordinate.js").Coordinate}
     */
    private position_;
    /**
     * @private
     * @type {import("./proj.js").TransformFunction}
     */
    private transform_;
    /**
     * @private
     * @type {number|undefined}
     */
    private watchId_;
    /**
     * @private
     */
    private handleProjectionChanged_;
    /**
     * @private
     */
    private handleTrackingChanged_;
    /**
     * @private
     * @param {GeolocationPosition} position position event.
     */
    private positionChange_;
    /**
     * @private
     * @param {GeolocationPositionError} error error object.
     */
    private positionError_;
    /**
     * Get the accuracy of the position in meters.
     * @return {number|undefined} The accuracy of the position measurement in
     *     meters.
     * @observable
     * @api
     */
    getAccuracy(): number | undefined;
    /**
     * Get a geometry of the position accuracy.
     * @return {?import("./geom/Polygon.js").default} A geometry of the position accuracy.
     * @observable
     * @api
     */
    getAccuracyGeometry(): Polygon | null;
    /**
     * Get the altitude associated with the position.
     * @return {number|undefined} The altitude of the position in meters above mean
     *     sea level.
     * @observable
     * @api
     */
    getAltitude(): number | undefined;
    /**
     * Get the altitude accuracy of the position.
     * @return {number|undefined} The accuracy of the altitude measurement in
     *     meters.
     * @observable
     * @api
     */
    getAltitudeAccuracy(): number | undefined;
    /**
     * Get the heading as radians clockwise from North.
     * Note: depending on the browser, the heading is only defined if the `enableHighAccuracy`
     * is set to `true` in the tracking options.
     * @return {number|undefined} The heading of the device in radians from north.
     * @observable
     * @api
     */
    getHeading(): number | undefined;
    /**
     * Get the position of the device.
     * @return {import("./coordinate.js").Coordinate|undefined} The current position of the device reported
     *     in the current projection.
     * @observable
     * @api
     */
    getPosition(): Coordinate | undefined;
    /**
     * Get the projection associated with the position.
     * @return {import("./proj/Projection.js").default|undefined} The projection the position is
     *     reported in.
     * @observable
     * @api
     */
    getProjection(): Projection | undefined;
    /**
     * Get the speed in meters per second.
     * @return {number|undefined} The instantaneous speed of the device in meters
     *     per second.
     * @observable
     * @api
     */
    getSpeed(): number | undefined;
    /**
     * Determine if the device location is being tracked.
     * @return {boolean} The device location is being tracked.
     * @observable
     * @api
     */
    getTracking(): boolean;
    /**
     * Get the tracking options.
     * See https://www.w3.org/TR/geolocation-API/#position-options.
     * @return {PositionOptions|undefined} PositionOptions as defined by
     *     the [HTML5 Geolocation spec
     *     ](https://www.w3.org/TR/geolocation-API/#position_options_interface).
     * @observable
     * @api
     */
    getTrackingOptions(): PositionOptions | undefined;
    /**
     * Set the projection to use for transforming the coordinates.
     * @param {import("./proj.js").ProjectionLike} projection The projection the position is
     *     reported in.
     * @observable
     * @api
     */
    setProjection(projection: ProjectionLike): void;
    /**
     * Enable or disable tracking.
     * @param {boolean} tracking Enable tracking.
     * @observable
     * @api
     */
    setTracking(tracking: boolean): void;
    /**
     * Set the tracking options.
     * See http://www.w3.org/TR/geolocation-API/#position-options.
     * @param {PositionOptions} options PositionOptions as defined by the
     *     [HTML5 Geolocation spec
     *     ](http://www.w3.org/TR/geolocation-API/#position_options_interface).
     * @observable
     * @api
     */
    setTrackingOptions(options: PositionOptions): void;
}

/**
 * @module ol/Kinetic
 */
/**
 * @classdesc
 * Implementation of inertial deceleration for map movement.
 *
 * @api
 */
declare class Kinetic {
    /**
     * @param {number} decay Rate of decay (must be negative).
     * @param {number} minVelocity Minimum velocity (pixels/millisecond).
     * @param {number} delay Delay to consider to calculate the kinetic
     *     initial values (milliseconds).
     */
    constructor(decay: number, minVelocity: number, delay: number);
    /**
     * @private
     * @type {number}
     */
    private decay_;
    /**
     * @private
     * @type {number}
     */
    private minVelocity_;
    /**
     * @private
     * @type {number}
     */
    private delay_;
    /**
     * @private
     * @type {Array<number>}
     */
    private points_;
    /**
     * @private
     * @type {number}
     */
    private angle_;
    /**
     * @private
     * @type {number}
     */
    private initialVelocity_;
    /**
     * FIXME empty description for jsdoc
     */
    begin(): void;
    /**
     * @param {number} x X.
     * @param {number} y Y.
     */
    update(x: number, y: number): void;
    /**
     * @return {boolean} Whether we should do kinetic animation.
     */
    end(): boolean;
    /**
     * @return {number} Total distance travelled (pixels).
     */
    getDistance(): number;
    /**
     * @return {number} Angle of the kinetic panning animation (radians).
     */
    getAngle(): number;
}
//# sourceMappingURL=Kinetic.d.ts.map

declare class MapBrowserEventHandler extends Target {
    /**
     * @param {import("./Map.js").default} map The map with the viewport to listen to events on.
     * @param {number} [moveTolerance] The minimal distance the pointer must travel to trigger a move.
     */
    constructor(map: Map, moveTolerance?: number);
    /**
     * This is the element that we will listen to the real events on.
     * @type {import("./Map.js").default}
     * @private
     */
    private map_;
    /**
     * @type {ReturnType<typeof setTimeout>}
     * @private
     */
    private clickTimeoutId_;
    /**
     * Emulate dblclick and singleclick. Will be true when only one pointer is active.
     * @type {boolean}
     */
    emulateClicks_: boolean;
    /**
     * @type {boolean}
     * @private
     */
    private dragging_;
    /**
     * @type {!Array<import("./events.js").EventsKey>}
     * @private
     */
    private dragListenerKeys_;
    /**
     * @type {number}
     * @private
     */
    private moveTolerance_;
    /**
     * The most recent "down" type event (or null if none have occurred).
     * Set on pointerdown.
     * @type {PointerEvent|null}
     * @private
     */
    private down_;
    /**
     * @type {Array<PointerEvent>}
     * @private
     */
    private activePointers_;
    /**
     * @type {!Object<number, Event>}
     * @private
     */
    private trackedTouches_;
    /**
     * @private
     */
    private element_;
    /**
     * @type {?import("./events.js").EventsKey}
     * @private
     */
    private pointerdownListenerKey_;
    /**
     * @type {PointerEvent}
     * @private
     */
    private originalPointerMoveEvent_;
    /**
     * @type {?import("./events.js").EventsKey}
     * @private
     */
    private relayedListenerKey_;
    /**
     * @private
     */
    private boundHandleTouchMove_;
    /**
     * @param {PointerEvent} pointerEvent Pointer
     * event.
     * @private
     */
    private emulateClick_;
    /**
     * Keeps track on how many pointers are currently active.
     *
     * @param {PointerEvent} pointerEvent Pointer
     * event.
     * @private
     */
    private updateActivePointers_;
    /**
     * @param {PointerEvent} pointerEvent Pointer
     * event.
     * @private
     */
    private handlePointerUp_;
    /**
     * @param {PointerEvent} pointerEvent Pointer
     * event.
     * @return {boolean} If the left mouse button was pressed.
     * @private
     */
    private isMouseActionButton_;
    /**
     * @param {PointerEvent} pointerEvent Pointer
     * event.
     * @private
     */
    private handlePointerDown_;
    /**
     * @param {PointerEvent} pointerEvent Pointer
     * event.
     * @private
     */
    private handlePointerMove_;
    /**
     * Wrap and relay a pointermove event.
     * @param {PointerEvent} pointerEvent Pointer
     * event.
     * @private
     */
    private relayMoveEvent_;
    /**
     * Flexible handling of a `touch-action: none` css equivalent: because calling
     * `preventDefault()` on a `pointermove` event does not stop native page scrolling
     * and zooming, we also listen for `touchmove` and call `preventDefault()` on it
     * when an interaction (currently `DragPan` handles the event.
     * @param {TouchEvent} event Event.
     * @private
     */
    private handleTouchMove_;
    /**
     * @param {PointerEvent} pointerEvent Pointer
     * event.
     * @return {boolean} Is moving.
     * @private
     */
    private isMoving_;
}
//# sourceMappingURL=MapBrowserEventHandler.d.ts.map

/**
 * Gets a unique ID for an object. This mutates the object so that further calls
 * with the same object as a parameter returns the same value. Unique IDs are generated
 * as a strictly increasing sequence. Adapted from goog.getUid.
 *
 * @param {Object} obj The object to get the unique ID for.
 * @return {string} The unique ID for the object.
 * @api
 */
declare function getUid(obj: any): string;
/**
 * OpenLayers version.
 * @type {string}
 */
declare const VERSION: string;

export { Collection, Disposable, Feature$1 as Feature, Geolocation, Graticule, ImageWrapper as Image, ImageCanvas, ImageTile, ImageWrapper, Kinetic, Map, MapBrowserEvent, MapBrowserEventHandler, MapEvent, BaseObject as Object, Observable, Overlay, Tile, TileQueue, TileRange, VERSION, VectorRenderTile, VectorTile$1 as VectorTile, View, getUid, layer_d as layer, proj_d as proj };
