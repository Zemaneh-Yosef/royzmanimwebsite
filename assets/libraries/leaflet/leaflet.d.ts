declare namespace index_d_exports {
  export { BBox, Feature, FeatureCollection, GeoJSON, GeoJsonGeometryTypes, GeoJsonObject, GeoJsonProperties, GeoJsonTypes, Geometry, GeometryCollection, GeometryObject, LineString, MultiLineString, MultiPoint, MultiPolygon, Point$1 as Point, Polygon, Position };
}
/**
 * The valid values for the "type" property of GeoJSON geometry objects.
 * https://tools.ietf.org/html/rfc7946#section-1.4
 */
type GeoJsonGeometryTypes = Geometry["type"];
/**
 * The value values for the "type" property of GeoJSON Objects.
 * https://tools.ietf.org/html/rfc7946#section-1.4
 */
type GeoJsonTypes = GeoJSON["type"];
/**
 * Bounding box
 * https://tools.ietf.org/html/rfc7946#section-5
 */
type BBox = [number, number, number, number] | [number, number, number, number, number, number];
/**
 * A Position is an array of coordinates.
 * https://tools.ietf.org/html/rfc7946#section-3.1.1
 * Array should contain between two and three elements.
 * The previous GeoJSON specification allowed more elements (e.g., which could be used to represent M values),
 * but the current specification only allows X, Y, and (optionally) Z to be defined.
 *
 * Note: the type will not be narrowed down to `[number, number] | [number, number, number]` due to
 * marginal benefits and the large impact of breaking change.
 *
 * See previous discussions on the type narrowing:
 * - {@link https://github.com/DefinitelyTyped/DefinitelyTyped/pull/21590|Nov 2017}
 * - {@link https://github.com/DefinitelyTyped/DefinitelyTyped/discussions/67773|Dec 2023}
 * - {@link https://github.com/DefinitelyTyped/DefinitelyTyped/discussions/71441| Dec 2024}
 *
 * One can use a
 * {@link https://www.typescriptlang.org/docs/handbook/2/narrowing.html#using-type-predicates|user-defined type guard that returns a type predicate}
 * to determine if a position is a 2D or 3D position.
 *
 * @example
 * import type { Position } from 'geojson';
 *
 * type StrictPosition = [x: number, y: number] | [x: number, y: number, z: number]
 *
 * function isStrictPosition(position: Position): position is StrictPosition {
 *   return position.length === 2 || position.length === 3
 * };
 *
 * let position: Position = [-116.91, 45.54];
 *
 * let x: number;
 * let y: number;
 * let z: number | undefined;
 *
 * if (isStrictPosition(position)) {
 *   // `tsc` would throw an error if we tried to destructure a fourth parameter
 * 	 [x, y, z] = position;
 * } else {
 * 	 throw new TypeError("Position is not a 2D or 3D point");
 * }
 */
type Position = number[];
/**
 * The base GeoJSON object.
 * https://tools.ietf.org/html/rfc7946#section-3
 * The GeoJSON specification also allows foreign members
 * (https://tools.ietf.org/html/rfc7946#section-6.1)
 * Developers should use "&" type in TypeScript or extend the interface
 * to add these foreign members.
 */
interface GeoJsonObject {
  // Don't include foreign members directly into this type def.
  // in order to preserve type safety.
  // [key: string]: any;
  /**
   * Specifies the type of GeoJSON object.
   */
  type: GeoJsonTypes;
  /**
   * Bounding box of the coordinate range of the object's Geometries, Features, or Feature Collections.
   * The value of the bbox member is an array of length 2*n where n is the number of dimensions
   * represented in the contained geometries, with all axes of the most southwesterly point
   * followed by all axes of the more northeasterly point.
   * The axes order of a bbox follows the axes order of geometries.
   * https://tools.ietf.org/html/rfc7946#section-5
   */
  bbox?: BBox | undefined;
}
/**
 * Union of GeoJSON objects.
 */
type GeoJSON<G extends Geometry | null = Geometry, P = GeoJsonProperties> = G | Feature<G, P> | FeatureCollection<G, P>;
/**
 * Geometry object.
 * https://tools.ietf.org/html/rfc7946#section-3
 */
type Geometry = Point$1 | MultiPoint | LineString | MultiLineString | Polygon | MultiPolygon | GeometryCollection;
type GeometryObject = Geometry;
/**
 * Point geometry object.
 * https://tools.ietf.org/html/rfc7946#section-3.1.2
 */
interface Point$1 extends GeoJsonObject {
  type: "Point";
  coordinates: Position;
}
/**
 * MultiPoint geometry object.
 *  https://tools.ietf.org/html/rfc7946#section-3.1.3
 */
interface MultiPoint extends GeoJsonObject {
  type: "MultiPoint";
  coordinates: Position[];
}
/**
 * LineString geometry object.
 * https://tools.ietf.org/html/rfc7946#section-3.1.4
 */
interface LineString extends GeoJsonObject {
  type: "LineString";
  coordinates: Position[];
}
/**
 * MultiLineString geometry object.
 * https://tools.ietf.org/html/rfc7946#section-3.1.5
 */
interface MultiLineString extends GeoJsonObject {
  type: "MultiLineString";
  coordinates: Position[][];
}
/**
 * Polygon geometry object.
 * https://tools.ietf.org/html/rfc7946#section-3.1.6
 */
interface Polygon extends GeoJsonObject {
  type: "Polygon";
  coordinates: Position[][];
}
/**
 * MultiPolygon geometry object.
 * https://tools.ietf.org/html/rfc7946#section-3.1.7
 */
interface MultiPolygon extends GeoJsonObject {
  type: "MultiPolygon";
  coordinates: Position[][][];
}
/**
 * Geometry Collection
 * https://tools.ietf.org/html/rfc7946#section-3.1.8
 */
interface GeometryCollection<G extends Geometry = Geometry> extends GeoJsonObject {
  type: "GeometryCollection";
  geometries: G[];
}
type GeoJsonProperties = {
  [name: string]: any;
} | null;
/**
 * A feature object which contains a geometry and associated properties.
 * https://tools.ietf.org/html/rfc7946#section-3.2
 */
interface Feature<G extends Geometry | null = Geometry, P = GeoJsonProperties> extends GeoJsonObject {
  type: "Feature";
  /**
   * The feature's geometry
   */
  geometry: G;
  /**
   * A value that uniquely identifies this feature in a
   * https://tools.ietf.org/html/rfc7946#section-3.2.
   */
  id?: string | number | undefined;
  /**
   * Properties associated with this feature.
   */
  properties: P;
}
/**
 * A collection of feature objects.
 *  https://tools.ietf.org/html/rfc7946#section-3.3
 */
interface FeatureCollection<G extends Geometry | null = Geometry, P = GeoJsonProperties> extends GeoJsonObject {
  type: "FeatureCollection";
  features: Array<Feature<G, P>>;
}
//#endregion
//#region node_modules/.pnpm/@types+leaflet@1.9.22/node_modules/@types/leaflet/index.d.ts
declare class Class {
  static extend(props: any): {
    new (...args: any[]): any;
  } & typeof Class;
  static include(props: any): any & typeof Class;
  static mergeOptions(props: any): any & typeof Class;
  static addInitHook(initHookFn: () => void): any & typeof Class;
  static addInitHook(methodName: string, ...args: any[]): any & typeof Class;
  static callInitHooks(): void;
}
interface CRS {
  latLngToPoint(latlng: LatLngExpression, zoom: number): Point;
  pointToLatLng(point: PointExpression, zoom: number): LatLng;
  project(latlng: LatLng | LatLngLiteral): Point;
  unproject(point: PointExpression): LatLng;
  scale(zoom: number): number;
  zoom(scale: number): number;
  getProjectedBounds(zoom: number): Bounds;
  distance(latlng1: LatLngExpression, latlng2: LatLngExpression): number;
  wrapLatLng(latlng: LatLng | LatLngLiteral): LatLng;
  code?: string | undefined;
  wrapLng?: [number, number] | undefined;
  wrapLat?: [number, number] | undefined;
  infinite: boolean;
}
declare namespace CRS {
  const EPSG3395: CRS;
  const EPSG3857: CRS;
  const EPSG4326: CRS;
  const EPSG900913: CRS;
  const Earth: CRS;
  const Simple: CRS;
}
declare class LatLng {
  constructor(latitude: number, longitude: number, altitude?: number);
  equals(otherLatLng: LatLngExpression, maxMargin?: number): boolean;
  toString(): string;
  distanceTo(otherLatLng: LatLngExpression): number;
  wrap(): LatLng;
  toBounds(sizeInMeters: number): LatLngBounds;
  clone(): LatLng;
  lat: number;
  lng: number;
  alt?: number | undefined;
}
interface LatLngLiteral {
  lat: number;
  lng: number;
  alt?: number;
}
type LatLngTuple = [number, number, number?];
type LatLngExpression = LatLng | LatLngLiteral | LatLngTuple;
declare class LatLngBounds {
  constructor(southWest: LatLngExpression, northEast: LatLngExpression);
  constructor(latlngs: LatLngExpression[]);
  extend(latlngOrBounds: LatLngExpression | LatLngBoundsExpression): this;
  pad(bufferRatio: number): LatLngBounds; // Returns a new LatLngBounds
  getCenter(): LatLng;
  getSouthWest(): LatLng;
  getNorthEast(): LatLng;
  getNorthWest(): LatLng;
  getSouthEast(): LatLng;
  getWest(): number;
  getSouth(): number;
  getEast(): number;
  getNorth(): number;
  contains(otherBoundsOrLatLng: LatLngBoundsExpression | LatLngExpression): boolean;
  intersects(otherBounds: LatLngBoundsExpression): boolean;
  overlaps(otherBounds: LatLngBoundsExpression): boolean;
  toBBoxString(): string;
  equals(otherBounds: LatLngBoundsExpression, maxMargin?: number): boolean;
  isValid(): boolean;
}
type LatLngBoundsLiteral = LatLngTuple[]; // Must be [LatLngTuple, LatLngTuple], cant't change because Map.setMaxBounds
type LatLngBoundsExpression = LatLngBounds | LatLngBoundsLiteral;
type PointTuple = [number, number];
declare class Point {
  constructor(x: number, y: number, round?: boolean);
  clone(): Point;
  add(otherPoint: PointExpression): Point; // non-destructive, returns a new point
  subtract(otherPoint: PointExpression): Point;
  divideBy(num: number): Point;
  multiplyBy(num: number): Point;
  scaleBy(scale: PointExpression): Point;
  unscaleBy(scale: PointExpression): Point;
  round(): Point;
  floor(): Point;
  ceil(): Point;
  trunc(): Point;
  distanceTo(otherPoint: PointExpression): number;
  equals(otherPoint: PointExpression): boolean;
  contains(otherPoint: PointExpression): boolean;
  toString(): string;
  x: number;
  y: number;
}
interface Coords extends Point {
  z: number;
}
type PointExpression = Point | PointTuple;
type BoundsLiteral = [PointTuple, PointTuple];
declare class Bounds {
  constructor(topLeft: PointExpression, bottomRight: PointExpression);
  constructor(points?: Point[] | BoundsLiteral);
  // tslint:disable:unified-signatures
  extend(point: PointExpression): this;
  extend(otherBounds: BoundsExpression): this;
  // tslint:enable:unified-signatures
  getCenter(round?: boolean): Point;
  getBottomLeft(): Point;
  getBottomRight(): Point;
  getTopLeft(): Point;
  getTopRight(): Point;
  getSize(): Point;
  contains(pointOrBounds: BoundsExpression | PointExpression): boolean;
  intersects(otherBounds: BoundsExpression): boolean;
  overlaps(otherBounds: BoundsExpression): boolean;
  isValid(): boolean;
  pad(bufferRatio: number): Bounds; // Returns a new Bounds
  equals(otherBounds: BoundsExpression): boolean;
  min?: Point | undefined;
  max?: Point | undefined;
}
type BoundsExpression = Bounds | BoundsLiteral;
// Event handler types
type LeafletEventHandlerFn = (event: LeafletEvent) => void;
type LayersControlEventHandlerFn = (event: LayersControlEvent) => void;
type LayerEventHandlerFn = (event: LayerEvent) => void;
type ResizeEventHandlerFn = (event: ResizeEvent) => void;
type PopupEventHandlerFn = (event: PopupEvent) => void;
type TooltipEventHandlerFn = (event: TooltipEvent) => void;
type ErrorEventHandlerFn = (event: ErrorEvent) => void;
type LocationEventHandlerFn = (event: LocationEvent) => void;
type LeafletMouseEventHandlerFn = (event: LeafletMouseEvent) => void;
type LeafletKeyboardEventHandlerFn = (event: LeafletKeyboardEvent) => void;
type ZoomAnimEventHandlerFn = (event: ZoomAnimEvent) => void;
type DragEndEventHandlerFn = (event: DragEndEvent) => void;
type TileEventHandlerFn = (event: TileEvent) => void;
type TileErrorEventHandlerFn = (event: TileErrorEvent) => void;
interface LeafletEventHandlerFnMap {
  baselayerchange?: LayersControlEventHandlerFn | undefined;
  overlayadd?: LayersControlEventHandlerFn | undefined;
  overlayremove?: LayersControlEventHandlerFn | undefined;
  layeradd?: LayerEventHandlerFn | undefined;
  layerremove?: LayerEventHandlerFn | undefined;
  zoomlevelschange?: LeafletEventHandlerFn | undefined;
  unload?: LeafletEventHandlerFn | undefined;
  viewreset?: LeafletEventHandlerFn | undefined;
  load?: LeafletEventHandlerFn | undefined;
  zoomstart?: LeafletEventHandlerFn | undefined;
  movestart?: LeafletEventHandlerFn | undefined;
  zoom?: LeafletEventHandlerFn | undefined;
  move?: LeafletEventHandlerFn | undefined;
  zoomend?: LeafletEventHandlerFn | undefined;
  moveend?: LeafletEventHandlerFn | undefined;
  autopanstart?: LeafletEventHandlerFn | undefined;
  dragstart?: LeafletEventHandlerFn | undefined;
  drag?: LeafletEventHandlerFn | undefined;
  add?: LeafletEventHandlerFn | undefined;
  remove?: LeafletEventHandlerFn | undefined;
  loading?: LeafletEventHandlerFn | undefined;
  error?: LeafletEventHandlerFn | undefined;
  update?: LeafletEventHandlerFn | undefined;
  down?: LeafletEventHandlerFn | undefined;
  predrag?: LeafletEventHandlerFn | undefined;
  resize?: ResizeEventHandlerFn | undefined;
  popupopen?: PopupEventHandlerFn | undefined;
  popupclose?: PopupEventHandlerFn | undefined;
  tooltipopen?: TooltipEventHandlerFn | undefined;
  tooltipclose?: TooltipEventHandlerFn | undefined;
  locationerror?: ErrorEventHandlerFn | undefined;
  locationfound?: LocationEventHandlerFn | undefined;
  click?: LeafletMouseEventHandlerFn | undefined;
  dblclick?: LeafletMouseEventHandlerFn | undefined;
  mousedown?: LeafletMouseEventHandlerFn | undefined;
  mouseup?: LeafletMouseEventHandlerFn | undefined;
  mouseover?: LeafletMouseEventHandlerFn | undefined;
  mouseout?: LeafletMouseEventHandlerFn | undefined;
  mousemove?: LeafletMouseEventHandlerFn | undefined;
  contextmenu?: LeafletMouseEventHandlerFn | undefined;
  preclick?: LeafletMouseEventHandlerFn | undefined;
  keypress?: LeafletKeyboardEventHandlerFn | undefined;
  keydown?: LeafletKeyboardEventHandlerFn | undefined;
  keyup?: LeafletKeyboardEventHandlerFn | undefined;
  zoomanim?: ZoomAnimEventHandlerFn | undefined;
  dragend?: DragEndEventHandlerFn | undefined;
  tileunload?: TileEventHandlerFn | undefined;
  tileloadstart?: TileEventHandlerFn | undefined;
  tileload?: TileEventHandlerFn | undefined;
  tileabort?: TileEventHandlerFn | undefined;
  tileerror?: TileErrorEventHandlerFn | undefined;
  // [name: string]: any;
  // You are able add additional properties, but it makes this interface uncheckable.
}
/**
 * Base class of Leaflet classes supporting events
 */
declare abstract class Evented extends Class {
  /**
   * Adds a listener function (fn) to a particular event type of the object.
   * You can optionally specify the context of the listener (object the this
   * keyword will point to). You can also pass several space-separated types
   * (e.g. 'click dblclick').
   */
  // tslint:disable:unified-signatures
  on(type: "baselayerchange" | "overlayadd" | "overlayremove", fn: LayersControlEventHandlerFn, context?: any): this;
  on(type: "layeradd" | "layerremove", fn: LayerEventHandlerFn, context?: any): this;
  on(type: "zoomlevelschange" | "unload" | "viewreset" | "load" | "zoomstart" | "movestart" | "zoom" | "move" | "zoomend" | "moveend" | "autopanstart" | "dragstart" | "drag" | "add" | "remove" | "loading" | "error" | "update" | "down" | "predrag", fn: LeafletEventHandlerFn, context?: any): this;
  on(type: "resize", fn: ResizeEventHandlerFn, context?: any): this;
  on(type: "popupopen" | "popupclose", fn: PopupEventHandlerFn, context?: any): this;
  on(type: "tooltipopen" | "tooltipclose", fn: TooltipEventHandlerFn, context?: any): this;
  on(type: "locationerror", fn: ErrorEventHandlerFn, context?: any): this;
  on(type: "locationfound", fn: LocationEventHandlerFn, context?: any): this;
  on(type: "click" | "dblclick" | "mousedown" | "mouseup" | "mouseover" | "mouseout" | "mousemove" | "contextmenu" | "preclick", fn: LeafletMouseEventHandlerFn, context?: any): this;
  on(type: "keypress" | "keydown" | "keyup", fn: LeafletKeyboardEventHandlerFn, context?: any): this;
  on(type: "zoomanim", fn: ZoomAnimEventHandlerFn, context?: any): this;
  on(type: "dragend", fn: DragEndEventHandlerFn, context?: any): this;
  on(type: "tileunload" | "tileloadstart" | "tileload" | "tileabort", fn: TileEventHandlerFn, context?: any): this;
  on(type: "tileerror", fn: TileErrorEventHandlerFn, context?: any): this;
  on(type: string, fn: LeafletEventHandlerFn, context?: any): this;
  /**
   * Adds a set of type/listener pairs, e.g. {click: onClick, mousemove: onMouseMove}
   */
  on(eventMap: LeafletEventHandlerFnMap): this;
  // tslint:enable:unified-signatures
  /**
   * Removes a previously added listener function. If no function is specified,
   * it will remove all the listeners of that particular event from the object.
   * Note that if you passed a custom context to on, you must pass the same context
   * to off in order to remove the listener.
   */
  // tslint:disable:unified-signatures
  off(type: "baselayerchange" | "overlayadd" | "overlayremove", fn?: LayersControlEventHandlerFn, context?: any): this;
  off(type: "layeradd" | "layerremove", fn?: LayerEventHandlerFn, context?: any): this;
  off(type: "zoomlevelschange" | "unload" | "viewreset" | "load" | "zoomstart" | "movestart" | "zoom" | "move" | "zoomend" | "moveend" | "autopanstart" | "dragstart" | "drag" | "add" | "remove" | "loading" | "error" | "update" | "down" | "predrag", fn?: LeafletEventHandlerFn, context?: any): this;
  off(type: "resize", fn?: ResizeEventHandlerFn, context?: any): this;
  off(type: "popupopen" | "popupclose", fn?: PopupEventHandlerFn, context?: any): this;
  off(type: "tooltipopen" | "tooltipclose", fn?: TooltipEventHandlerFn, context?: any): this;
  off(type: "locationerror", fn?: ErrorEventHandlerFn, context?: any): this;
  off(type: "locationfound", fn?: LocationEventHandlerFn, context?: any): this;
  off(type: "click" | "dblclick" | "mousedown" | "mouseup" | "mouseover" | "mouseout" | "mousemove" | "contextmenu" | "preclick", fn?: LeafletMouseEventHandlerFn, context?: any): this;
  off(type: "keypress" | "keydown" | "keyup", fn?: LeafletKeyboardEventHandlerFn, context?: any): this;
  off(type: "zoomanim", fn?: ZoomAnimEventHandlerFn, context?: any): this;
  off(type: "dragend", fn?: DragEndEventHandlerFn, context?: any): this;
  off(type: "tileunload" | "tileloadstart" | "tileload" | "tileabort", fn?: TileEventHandlerFn, context?: any): this;
  off(type: "tileerror", fn?: TileErrorEventHandlerFn, context?: any): this;
  off(type: string, fn?: LeafletEventHandlerFn, context?: any): this;
  /**
   * Removes a set of type/listener pairs.
   */
  // With an eventMap there are no additional arguments allowed
  off(eventMap: LeafletEventHandlerFnMap): this;
  /**
   * Removes all listeners to all events on the object.
   */
  off(): this;
  // tslint:enable:unified-signatures
  /**
   * Fires an event of the specified type. You can optionally provide a data
   * object — the first argument of the listener function will contain its properties.
   * The event might can optionally be propagated to event parents.
   */
  fire(type: string, data?: any, propagate?: boolean): this;
  /**
   * Returns true if a particular event type has any listeners attached to it.
   */
  // tslint:disable:unified-signatures
  listens(type: "baselayerchange" | "overlayadd" | "overlayremove" | "layeradd" | "layerremove" | "zoomlevelschange" | "unload" | "viewreset" | "load" | "zoomstart" | "movestart" | "zoom" | "move" | "zoomend" | "moveend" | "autopanstart" | "dragstart" | "drag" | "add" | "remove" | "loading" | "error" | "update" | "down" | "predrag" | "resize" | "popupopen" | "tooltipopen" | "tooltipclose" | "locationerror" | "locationfound" | "click" | "dblclick" | "mousedown" | "mouseup" | "mouseover" | "mouseout" | "mousemove" | "contextmenu" | "preclick" | "keypress" | "keydown" | "keyup" | "zoomanim" | "dragend" | "tileunload" | "tileloadstart" | "tileload" | "tileabort" | "tileerror", propagate?: boolean): boolean;
  listens(type: "baselayerchange" | "overlayadd" | "overlayremove", fn: LayersControlEventHandlerFn, context?: any, propagate?: boolean): boolean;
  listens(type: "layeradd" | "layerremove", fn: LayerEventHandlerFn, context?: any, propagate?: boolean): boolean;
  listens(type: "zoomlevelschange" | "unload" | "viewreset" | "load" | "zoomstart" | "movestart" | "zoom" | "move" | "zoomend" | "moveend" | "autopanstart" | "dragstart" | "drag" | "add" | "remove" | "loading" | "error" | "update" | "down" | "predrag", fn: LeafletEventHandlerFn, context?: any, propagate?: boolean): boolean;
  listens(type: "resize", fn: ResizeEventHandlerFn, context?: any, propagate?: boolean): boolean;
  listens(type: "popupopen" | "popupclose", fn: PopupEventHandlerFn, context?: any, propagate?: boolean): boolean;
  listens(type: "tooltipopen" | "tooltipclose", fn: TooltipEventHandlerFn, context?: any, propagate?: boolean): boolean;
  listens(type: "locationerror", fn: ErrorEventHandlerFn, context?: any, propagate?: boolean): boolean;
  listens(type: "locationfound", fn: LocationEventHandlerFn, context?: any, propagate?: boolean): boolean;
  listens(type: "click" | "dblclick" | "mousedown" | "mouseup" | "mouseover" | "mouseout" | "mousemove" | "contextmenu" | "preclick", fn: LeafletMouseEventHandlerFn, context?: any, propagate?: boolean): boolean;
  listens(type: "keypress" | "keydown" | "keyup", fn: LeafletKeyboardEventHandlerFn, context?: any, propagate?: boolean): boolean;
  listens(type: "zoomanim", fn: ZoomAnimEventHandlerFn, context?: any, propagate?: boolean): boolean;
  listens(type: "dragend", fn: DragEndEventHandlerFn, context?: any, propagate?: boolean): boolean;
  listens(type: "tileunload" | "tileloadstart" | "tileload" | "tileabort", fn: TileEventHandlerFn, context?: any, propagate?: boolean): boolean;
  listens(type: "tileerror", fn: TileEventHandlerFn, context?: any, propagate?: boolean): boolean;
  listens(type: string, fn: LeafletEventHandlerFn, context?: any, propagate?: boolean): boolean;
  /**
   * Behaves as on(...), except the listener will only get fired once and then removed.
   */
  // tslint:disable:unified-signatures
  once(type: "baselayerchange" | "overlayadd" | "overlayremove", fn: LayersControlEventHandlerFn, context?: any): this;
  once(type: "layeradd" | "layerremove", fn: LayerEventHandlerFn, context?: any): this;
  once(type: "zoomlevelschange" | "unload" | "viewreset" | "load" | "zoomstart" | "movestart" | "zoom" | "move" | "zoomend" | "moveend" | "autopanstart" | "dragstart" | "drag" | "add" | "remove" | "loading" | "error" | "update" | "down" | "predrag", fn: LeafletEventHandlerFn, context?: any): this;
  once(type: "resize", fn: ResizeEventHandlerFn, context?: any): this;
  once(type: "popupopen" | "popupclose", fn: PopupEventHandlerFn, context?: any): this;
  once(type: "tooltipopen" | "tooltipclose", fn: TooltipEventHandlerFn, context?: any): this;
  once(type: "locationerror", fn: ErrorEventHandlerFn, context?: any): this;
  once(type: "locationfound", fn: LocationEventHandlerFn, context?: any): this;
  once(type: "click" | "dblclick" | "mousedown" | "mouseup" | "mouseover" | "mouseout" | "mousemove" | "contextmenu" | "preclick", fn: LeafletMouseEventHandlerFn, context?: any): this;
  once(type: "keypress" | "keydown" | "keyup", fn: LeafletKeyboardEventHandlerFn, context?: any): this;
  once(type: "zoomanim", fn: ZoomAnimEventHandlerFn, context?: any): this;
  once(type: "dragend", fn: DragEndEventHandlerFn, context?: any): this;
  once(type: "tileunload" | "tileloadstart" | "tileload" | "tileabort", fn: TileEventHandlerFn, context?: any): this;
  once(type: "tileerror", fn: TileEventHandlerFn, context?: any): this;
  once(type: string, fn: LeafletEventHandlerFn, context?: any): this;
  /**
   * Behaves as on(...), except the listener will only get fired once and then removed.
   */
  once(eventMap: LeafletEventHandlerFnMap): this;
  // tslint:enable:unified-signatures
  /**
   * Adds an event parent - an Evented that will receive propagated events
   */
  addEventParent(obj: Evented): this;
  /**
   * Removes an event parent, so it will stop receiving propagated events
   */
  removeEventParent(obj: Evented): this;
  /**
   * Alias for on(...)
   *
   * Adds a listener function (fn) to a particular event type of the object.
   * You can optionally specify the context of the listener (object the this
   * keyword will point to). You can also pass several space-separated types
   * (e.g. 'click dblclick').
   */
  // tslint:disable:unified-signatures
  addEventListener(type: "baselayerchange" | "overlayadd" | "overlayremove", fn: LayersControlEventHandlerFn, context?: any): this;
  addEventListener(type: "layeradd" | "layerremove", fn: LayerEventHandlerFn, context?: any): this;
  addEventListener(type: "zoomlevelschange" | "unload" | "viewreset" | "load" | "zoomstart" | "movestart" | "zoom" | "move" | "zoomend" | "moveend" | "autopanstart" | "dragstart" | "drag" | "add" | "remove" | "loading" | "error" | "update" | "down" | "predrag", fn: LeafletEventHandlerFn, context?: any): this;
  addEventListener(type: "resize", fn: ResizeEventHandlerFn, context?: any): this;
  addEventListener(type: "popupopen" | "popupclose", fn: PopupEventHandlerFn, context?: any): this;
  addEventListener(type: "tooltipopen" | "tooltipclose", fn: TooltipEventHandlerFn, context?: any): this;
  addEventListener(type: "locationerror", fn: ErrorEventHandlerFn, context?: any): this;
  addEventListener(type: "locationfound", fn: LocationEventHandlerFn, context?: any): this;
  addEventListener(type: "click" | "dblclick" | "mousedown" | "mouseup" | "mouseover" | "mouseout" | "mousemove" | "contextmenu" | "preclick", fn: LeafletMouseEventHandlerFn, context?: any): this;
  addEventListener(type: "keypress" | "keydown" | "keyup", fn: LeafletKeyboardEventHandlerFn, context?: any): this;
  addEventListener(type: "zoomanim", fn: ZoomAnimEventHandlerFn, context?: any): this;
  addEventListener(type: "dragend", fn: DragEndEventHandlerFn, context?: any): this;
  addEventListener(type: "tileunload" | "tileloadstart" | "tileload" | "tileabort", fn: TileEventHandlerFn, context?: any): this;
  addEventListener(type: "tileerror", fn: TileErrorEventHandlerFn, context?: any): this;
  addEventListener(type: string, fn: LeafletEventHandlerFn, context?: any): this;
  /**
   * Alias for on(...)
   *
   * Adds a set of type/listener pairs, e.g. {click: onClick, mousemove: onMouseMove}
   */
  addEventListener(eventMap: LeafletEventHandlerFnMap): this;
  // tslint:enable:unified-signatures
  /**
   * Alias for off(...)
   *
   * Removes a previously added listener function. If no function is specified,
   * it will remove all the listeners of that particular event from the object.
   * Note that if you passed a custom context to on, you must pass the same context
   * to off in order to remove the listener.
   */
  // tslint:disable:unified-signatures
  removeEventListener(type: "baselayerchange" | "overlayadd" | "overlayremove", fn?: LayersControlEventHandlerFn, context?: any): this;
  removeEventListener(type: "layeradd" | "layerremove", fn?: LayerEventHandlerFn, context?: any): this;
  removeEventListener(type: "zoomlevelschange" | "unload" | "viewreset" | "load" | "zoomstart" | "movestart" | "zoom" | "move" | "zoomend" | "moveend" | "autopanstart" | "dragstart" | "drag" | "add" | "remove" | "loading" | "error" | "update" | "down" | "predrag", fn?: LeafletEventHandlerFn, context?: any): this;
  removeEventListener(type: "resize", fn?: ResizeEventHandlerFn, context?: any): this;
  removeEventListener(type: "popupopen" | "popupclose", fn?: PopupEventHandlerFn, context?: any): this;
  removeEventListener(type: "tooltipopen" | "tooltipclose", fn?: TooltipEventHandlerFn, context?: any): this;
  removeEventListener(type: "locationerror", fn?: ErrorEventHandlerFn, context?: any): this;
  removeEventListener(type: "locationfound", fn?: LocationEventHandlerFn, context?: any): this;
  removeEventListener(type: "click" | "dblclick" | "mousedown" | "mouseup" | "mouseover" | "mouseout" | "mousemove" | "contextmenu" | "preclick", fn?: LeafletMouseEventHandlerFn, context?: any): this;
  removeEventListener(type: "keypress" | "keydown" | "keyup", fn?: LeafletKeyboardEventHandlerFn, context?: any): this;
  removeEventListener(type: "zoomanim", fn?: ZoomAnimEventHandlerFn, context?: any): this;
  removeEventListener(type: "dragend", fn?: DragEndEventHandlerFn, context?: any): this;
  removeEventListener(type: "tileunload" | "tileloadstart" | "tileload" | "tileabort", fn?: TileEventHandlerFn, context?: any): this;
  removeEventListener(type: "tileerror", fn?: TileErrorEventHandlerFn, context?: any): this;
  removeEventListener(type: string, fn?: LeafletEventHandlerFn, context?: any): this;
  /**
   * Alias for off(...)
   *
   * Removes a set of type/listener pairs.
   */
  removeEventListener(eventMap: LeafletEventHandlerFnMap): this;
  // tslint:enable:unified-signatures
  /**
   * Alias for off()
   *
   * Removes all listeners to all events on the object.
   */
  clearAllEventListeners(): this;
  /**
   * Alias for once(...)
   *
   * Behaves as on(...), except the listener will only get fired once and then removed.
   */
  // tslint:disable:unified-signatures
  addOneTimeEventListener(type: "baselayerchange" | "overlayadd" | "overlayremove", fn: LayersControlEventHandlerFn, context?: any): this;
  addOneTimeEventListener(type: "layeradd" | "layerremove", fn: LayerEventHandlerFn, context?: any): this;
  addOneTimeEventListener(type: "zoomlevelschange" | "unload" | "viewreset" | "load" | "zoomstart" | "movestart" | "zoom" | "move" | "zoomend" | "moveend" | "autopanstart" | "dragstart" | "drag" | "add" | "remove" | "loading" | "error" | "update" | "down" | "predrag", fn: LeafletEventHandlerFn, context?: any): this;
  addOneTimeEventListener(type: "resize", fn: ResizeEventHandlerFn, context?: any): this;
  addOneTimeEventListener(type: "popupopen" | "popupclose", fn: PopupEventHandlerFn, context?: any): this;
  addOneTimeEventListener(type: "tooltipopen" | "tooltipclose", fn: TooltipEventHandlerFn, context?: any): this;
  addOneTimeEventListener(type: "locationerror", fn: ErrorEventHandlerFn, context?: any): this;
  addOneTimeEventListener(type: "locationfound", fn: LocationEventHandlerFn, context?: any): this;
  addOneTimeEventListener(type: "click" | "dblclick" | "mousedown" | "mouseup" | "mouseover" | "mouseout" | "mousemove" | "contextmenu" | "preclick", fn: LeafletMouseEventHandlerFn, context?: any): this;
  addOneTimeEventListener(type: "keypress" | "keydown" | "keyup", fn: LeafletKeyboardEventHandlerFn, context?: any): this;
  addOneTimeEventListener(type: "zoomanim", fn: ZoomAnimEventHandlerFn, context?: any): this;
  addOneTimeEventListener(type: "dragend", fn: DragEndEventHandlerFn, context?: any): this;
  addOneTimeEventListener(type: "tileunload" | "tileloadstart" | "tileload" | "tileabort", fn: TileEventHandlerFn, context?: any): this;
  addOneTimeEventListener(type: "tileerror", fn: TileErrorEventHandlerFn, context?: any): this;
  addOneTimeEventListener(type: string, fn: LeafletEventHandlerFn, context?: any): this;
  /**
   * Alias for once(...)
   *
   * Behaves as on(...), except the listener will only get fired once and then removed.
   */
  addOneTimeEventListener(eventMap: LeafletEventHandlerFnMap): this;
  // tslint:enable:unified-signatures
  /**
   * Alias for fire(...)
   *
   * Fires an event of the specified type. You can optionally provide a data
   * object — the first argument of the listener function will contain its properties.
   * The event might can optionally be propagated to event parents.
   */
  fireEvent(type: string, data?: any, propagate?: boolean): this;
  /**
   * Alias for listens(...)
   *
   * Returns true if a particular event type has any listeners attached to it.
   */
  hasEventListeners(type: string): boolean;
}
interface LayerOptions {
  pane?: string | undefined;
  attribution?: string | undefined;
}
interface InteractiveLayerOptions extends LayerOptions {
  interactive?: boolean | undefined;
  bubblingMouseEvents?: boolean | undefined;
}
declare class Layer extends Evented {
  constructor(options?: LayerOptions);
  addTo(map: Map | LayerGroup): this;
  remove(): this;
  removeFrom(map: Map): this;
  getPane(name?: string): HTMLElement | undefined;
  addInteractiveTarget(targetEl: HTMLElement): this;
  removeInteractiveTarget(targetEl: HTMLElement): this;
  // Popup methods
  bindPopup(content: ((layer: Layer) => Content) | Content | Popup, options?: PopupOptions): this;
  unbindPopup(): this;
  openPopup(latlng?: LatLngExpression): this;
  closePopup(): this;
  togglePopup(): this;
  isPopupOpen(): boolean;
  setPopupContent(content: Content | Popup): this;
  getPopup(): Popup | undefined;
  // Tooltip methods
  bindTooltip(content: ((layer: Layer) => Content) | Tooltip | Content, options?: TooltipOptions): this;
  unbindTooltip(): this;
  openTooltip(latlng?: LatLngExpression): this;
  closeTooltip(): this;
  toggleTooltip(): this;
  isTooltipOpen(): boolean;
  setTooltipContent(content: Content | Tooltip): this;
  getTooltip(): Tooltip | undefined;
  // Extension methods
  onAdd(map: Map): this;
  onRemove(map: Map): this;
  getEvents?(): {
    [name: string]: LeafletEventHandlerFn;
  };
  getAttribution?(): string | null;
  beforeAdd?(map: Map): this;
  protected _map: Map;
  options: LayerOptions;
}
interface GridLayerOptions extends LayerOptions {
  tileSize?: number | Point | undefined;
  opacity?: number | undefined;
  updateWhenIdle?: boolean | undefined;
  updateWhenZooming?: boolean | undefined;
  updateInterval?: number | undefined;
  zIndex?: number | undefined;
  bounds?: LatLngBoundsExpression | undefined;
  minZoom?: number | undefined;
  maxZoom?: number | undefined;
  /**
   * Maximum zoom number the tile source has available. If it is specified, the tiles on all zoom levels higher than
   * `maxNativeZoom` will be loaded from `maxNativeZoom` level and auto-scaled.
   */
  maxNativeZoom?: number | undefined;
  /**
   * Minimum zoom number the tile source has available. If it is specified, the tiles on all zoom levels lower than
   * `minNativeZoom` will be loaded from `minNativeZoom` level and auto-scaled.
   */
  minNativeZoom?: number | undefined;
  noWrap?: boolean | undefined;
  pane?: string | undefined;
  className?: string | undefined;
  keepBuffer?: number | undefined;
}
type DoneCallback = (error?: Error, tile?: HTMLElement) => void;
interface InternalTiles {
  [key: string]: {
    active?: boolean | undefined;
    coords: Coords;
    current: boolean;
    el: HTMLElement;
    loaded?: Date | undefined;
    retain?: boolean | undefined;
  };
}
declare class GridLayer extends Layer {
  constructor(options?: GridLayerOptions);
  bringToFront(): this;
  bringToBack(): this;
  getContainer(): HTMLElement | null;
  setOpacity(opacity: number): this;
  setZIndex(zIndex: number): this;
  isLoading(): boolean;
  redraw(): this;
  getTileSize(): Point;
  protected createTile(coords: Coords, done: DoneCallback): HTMLElement;
  protected _tileCoordsToKey(coords: Coords): string;
  protected _wrapCoords(parameter: Coords): Coords;
  protected _tiles: InternalTiles;
  protected _tileZoom?: number | undefined;
}
interface TileLayerOptions extends GridLayerOptions {
  id?: string | undefined;
  subdomains?: string | string[] | undefined;
  errorTileUrl?: string | undefined;
  zoomOffset?: number | undefined;
  tms?: boolean | undefined;
  zoomReverse?: boolean | undefined;
  detectRetina?: boolean | undefined;
  crossOrigin?: CrossOrigin | boolean | undefined;
  referrerPolicy?: ReferrerPolicy | boolean | undefined;
  // [name: string]: any;
  // You are able add additional properties, but it makes this interface uncheckable.
  // See: https://github.com/DefinitelyTyped/DefinitelyTyped/issues/15313
  // Example:
  // tileLayer = L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png?{foo}&{bar}&{abc}', {foo: 'bar', bar: (data: any) => 'foo', abc: () => ''});
}
declare class TileLayer extends GridLayer {
  constructor(urlTemplate: string, options?: TileLayerOptions);
  setUrl(url: string, noRedraw?: boolean): this;
  getTileUrl(coords: L.Coords): string;
  protected _tileOnLoad(done: L.DoneCallback, tile: HTMLElement): void;
  protected _tileOnError(done: L.DoneCallback, tile: HTMLElement, e: Error): void;
  protected _abortLoading(): void;
  protected _getZoomForUrl(): number;
  options: TileLayerOptions;
}
export declare function tileLayer(urlTemplate: string, options?: TileLayerOptions): TileLayer;
declare namespace TileLayer {
  class WMS extends TileLayer {
    constructor(baseUrl: string, options: WMSOptions);
    setParams(params: WMSParams, noRedraw?: boolean): this;
    wmsParams: WMSParams;
    options: WMSOptions;
  }
}
interface WMSOptions extends TileLayerOptions {
  layers?: string | undefined;
  styles?: string | undefined;
  format?: string | undefined;
  transparent?: boolean | undefined;
  version?: string | undefined;
  crs?: CRS | undefined;
  uppercase?: boolean | undefined;
}
interface WMSParams {
  format?: string | undefined;
  layers: string;
  request?: string | undefined;
  service?: string | undefined;
  styles?: string | undefined;
  version?: string | undefined;
  transparent?: boolean | undefined;
  width?: number | undefined;
  height?: number | undefined;
}
export declare namespace tileLayer {
  function wms(baseUrl: string, options?: WMSOptions): TileLayer.WMS;
}
type CrossOrigin = "anonymous" | "use-credentials" | "";
type ReferrerPolicy = "no-referrer" | "no-referrer-when-downgrade" | "origin" | "origin-when-cross-origin" | "same-origin" | "strict-origin" | "strict-origin-when-cross-origin" | "unsafe-url";
type LineCapShape = "butt" | "round" | "square" | "inherit";
type LineJoinShape = "miter" | "round" | "bevel" | "inherit";
type FillRule = "nonzero" | "evenodd" | "inherit";
interface PathOptions extends InteractiveLayerOptions {
  stroke?: boolean | undefined;
  color?: string | undefined;
  weight?: number | undefined;
  opacity?: number | undefined;
  lineCap?: LineCapShape | undefined;
  lineJoin?: LineJoinShape | undefined;
  dashArray?: string | number[] | undefined;
  dashOffset?: string | undefined;
  fill?: boolean | undefined;
  fillColor?: string | undefined;
  fillOpacity?: number | undefined;
  fillRule?: FillRule | undefined;
  renderer?: Renderer | undefined;
  className?: string | undefined;
}
declare abstract class Path extends Layer {
  redraw(): this;
  setStyle(style: PathOptions): this;
  bringToFront(): this;
  bringToBack(): this;
  getElement(): Element | undefined;
  options: PathOptions;
}
interface PolylineOptions extends PathOptions {
  smoothFactor?: number | undefined;
  noClip?: boolean | undefined;
}
declare class Polyline<T extends GeometryObject = LineString | MultiLineString, P = any> extends Path {
  constructor(latlngs: LatLngExpression[] | LatLngExpression[][], options?: PolylineOptions);
  toGeoJSON(precision?: number | false): Feature<T, P>;
  getLatLngs(): LatLng[] | LatLng[][] | LatLng[][][];
  setLatLngs(latlngs: LatLngExpression[] | LatLngExpression[][] | LatLngExpression[][][]): this;
  isEmpty(): boolean;
  getCenter(): LatLng;
  getBounds(): LatLngBounds;
  addLatLng(latlng: LatLngExpression | LatLngExpression[], latlngs?: LatLng[]): this;
  closestLayerPoint(p: Point): Point;
  feature?: Feature<T, P> | undefined;
  options: PolylineOptions;
}
export declare function polyline<T extends GeometryObject = LineString | MultiLineString, P = any>(latlngs: LatLngExpression[] | LatLngExpression[][], options?: PolylineOptions): Polyline<T, P>;
interface CircleMarkerOptions extends PathOptions {
  radius?: number | undefined;
}
declare class CircleMarker<P = any> extends Path {
  constructor(latlng: LatLngExpression, options: CircleMarkerOptions);
  toGeoJSON(precision?: number | false): Feature<Point$1, P>;
  setLatLng(latLng: LatLngExpression): this;
  getLatLng(): LatLng;
  setRadius(radius: number): this;
  getRadius(): number;
  setStyle(options: Partial<CircleMarkerOptions>): this;
  options: CircleMarkerOptions;
  feature?: Feature<Point$1, P> | undefined;
}
export declare function circleMarker<P = any>(latlng: LatLngExpression, options?: CircleMarkerOptions): CircleMarker<P>;
type CircleOptions = CircleMarkerOptions;
declare class Circle<P = any> extends CircleMarker<P> {
  constructor(latlng: LatLngExpression, options: CircleOptions);
  constructor(latlng: LatLngExpression, radius: number, options?: CircleOptions); // deprecated!
  toGeoJSON(precision?: number | false): any;
  getBounds(): LatLngBounds;
  setRadius(radius: number): this;
  getRadius(): number;
  setStyle(style: PathOptions): this;
}
export declare function circle<P = any>(latlng: LatLngExpression, options: CircleMarkerOptions): Circle<P>;
/**
 * @deprecated Passing the radius outside the options is deperecated. Use {@link circle:1} instead.
 */
export declare function circle<P = any>(latlng: LatLngExpression, radius: number, options?: CircleMarkerOptions): Circle<P>;
interface RendererOptions extends LayerOptions {
  padding?: number | undefined;
  tolerance?: number | undefined;
}
declare class Renderer extends Layer {
  constructor(options?: RendererOptions);
  options: RendererOptions;
}
/**
 * Used to group several layers and handle them as one.
 * If you add it to the map, any layers added or removed from the group will be
 * added/removed on the map as well. Extends Layer.
 */
declare class LayerGroup<P = any> extends Layer {
  constructor(layers?: Layer[], options?: LayerOptions);
  toMultiPoint(precision?: number): Feature<MultiPoint, P>;
  /**
   * Returns a GeoJSON representation of the layer group (as a GeoJSON GeometryCollection, GeoJSONFeatureCollection or Multipoint).
   */
  toGeoJSON(precision?: number | false): FeatureCollection<GeometryObject, P> | Feature<MultiPoint, P> | GeometryCollection;
  /**
   * Adds the given layer to the group.
   */
  addLayer(layer: Layer): this;
  /**
   * Removes the layer with the given internal ID or the given layer from the group.
   */
  removeLayer(layer: number | Layer): this;
  /**
   * Returns true if the given layer is currently added to the group.
   */
  hasLayer(layer: Layer): boolean;
  /**
   * Removes all the layers from the group.
   */
  clearLayers(): this;
  /**
   * Calls methodName on every layer contained in this group, passing any additional parameters.
   * Has no effect if the layers contained do not implement methodName.
   */
  invoke(methodName: string, ...params: any[]): this;
  /**
   * Iterates over the layers of the group,
   * optionally specifying context of the iterator function.
   */
  eachLayer(fn: (layer: Layer) => void, context?: any): this;
  /**
   * Returns the layer with the given internal ID.
   */
  getLayer(id: number): Layer | undefined;
  /**
   * Returns an array of all the layers added to the group.
   */
  getLayers(): Layer[];
  /**
   * Calls setZIndex on every layer contained in this group, passing the z-index.
   */
  setZIndex(zIndex: number): this;
  /**
   * Returns the internal ID for a layer
   */
  getLayerId(layer: Layer): number;
  feature?: FeatureCollection<GeometryObject, P> | Feature<MultiPoint, P> | GeometryCollection | undefined;
}
type Zoom = boolean | "center";
interface MapOptions {
  preferCanvas?: boolean | undefined;
  // Control options
  attributionControl?: boolean | undefined;
  zoomControl?: boolean | undefined;
  // Interaction options
  closePopupOnClick?: boolean | undefined;
  zoomSnap?: number | undefined;
  zoomDelta?: number | undefined;
  trackResize?: boolean | undefined;
  boxZoom?: boolean | undefined;
  doubleClickZoom?: Zoom | undefined;
  dragging?: boolean | undefined;
  // Map state options
  crs?: CRS | undefined;
  center?: LatLngExpression | undefined;
  zoom?: number | undefined;
  minZoom?: number | undefined;
  maxZoom?: number | undefined;
  layers?: Layer[] | undefined;
  maxBounds?: LatLngBoundsExpression | undefined;
  renderer?: Renderer | undefined;
  // Animation options
  fadeAnimation?: boolean | undefined;
  markerZoomAnimation?: boolean | undefined;
  transform3DLimit?: number | undefined;
  zoomAnimation?: boolean | undefined;
  zoomAnimationThreshold?: number | undefined;
  // Panning inertia options
  inertia?: boolean | undefined;
  inertiaDeceleration?: number | undefined;
  inertiaMaxSpeed?: number | undefined;
  easeLinearity?: number | undefined;
  worldCopyJump?: boolean | undefined;
  maxBoundsViscosity?: number | undefined;
  // Keyboard navigation options
  keyboard?: boolean | undefined;
  keyboardPanDelta?: number | undefined;
  // Mousewheel options
  scrollWheelZoom?: Zoom | undefined;
  wheelDebounceTime?: number | undefined;
  wheelPxPerZoomLevel?: number | undefined;
  // Touch interaction options
  tapHold?: boolean | undefined;
  tapTolerance?: number | undefined;
  touchZoom?: Zoom | undefined;
  bounceAtZoomLimits?: boolean | undefined;
}
type ControlPosition = "topleft" | "topright" | "bottomleft" | "bottomright";
interface ControlOptions {
  position?: ControlPosition | undefined;
}
declare class Control<Options extends ControlOptions = ControlOptions> extends Class {
  static extend<T extends object, Options extends ControlOptions = ControlOptions>(props: T): {
    new (...args: any[]): T;
  } & typeof Control<Options>;
  constructor(options?: Options);
  getPosition(): ControlPosition;
  setPosition(position: ControlPosition): this;
  getContainer(): HTMLElement | undefined;
  addTo(map: Map): this;
  remove(): this;
  // Extension methods
  onAdd?(map: Map): HTMLElement;
  onRemove?(map: Map): void;
  options: Options;
}
declare namespace Control {
  interface ZoomOptions extends ControlOptions {
    zoomInText?: string | undefined;
    zoomInTitle?: string | undefined;
    zoomOutText?: string | undefined;
    zoomOutTitle?: string | undefined;
  }
  class Zoom extends Control {
    constructor(options?: ZoomOptions);
    options: ZoomOptions;
  }
  interface AttributionOptions extends ControlOptions {
    prefix?: string | boolean | undefined;
  }
  class Attribution extends Control {
    constructor(options?: AttributionOptions);
    setPrefix(prefix: string | false): this;
    addAttribution(text: string): this;
    removeAttribution(text: string): this;
    options: AttributionOptions;
  }
  interface LayersOptions extends ControlOptions {
    collapsed?: boolean | undefined;
    autoZIndex?: boolean | undefined;
    hideSingleBase?: boolean | undefined;
    /**
     * Whether to sort the layers. When `false`, layers will keep the order in which they were added to the control.
     */
    sortLayers?: boolean | undefined;
    /**
     * A [compare function](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Array/sort)
     * that will be used for sorting the layers, when `sortLayers` is `true`. The function receives both the
     * [`L.Layer`](https://leafletjs.com/reference.html#layer) instances and their names, as in
     * `sortFunction(layerA, layerB, nameA, nameB)`. By default, it sorts layers alphabetically by their name.
     */
    sortFunction?: ((layerA: Layer, layerB: Layer, nameA: string, nameB: string) => number) | undefined;
  }
  interface LayersObject {
    [name: string]: Layer;
  }
  class Layers extends Control {
    constructor(baseLayers?: LayersObject, overlays?: LayersObject, options?: LayersOptions);
    addBaseLayer(layer: Layer, name: string): this;
    addOverlay(layer: Layer, name: string): this;
    removeLayer(layer: Layer): this;
    expand(): this;
    collapse(): this;
    options: LayersOptions;
  }
  interface ScaleOptions extends ControlOptions {
    maxWidth?: number | undefined;
    metric?: boolean | undefined;
    imperial?: boolean | undefined;
    updateWhenIdle?: boolean | undefined;
  }
  class Scale extends Control {
    constructor(options?: ScaleOptions);
    options: ScaleOptions;
  }
}
interface DivOverlayOptions {
  offset?: PointExpression | undefined;
  className?: string | undefined;
  pane?: string | undefined;
  interactive?: boolean | undefined;
  content?: string | HTMLElement | ((layer: Layer) => string) | ((layer: Layer) => HTMLElement);
}
declare abstract class DivOverlay extends Layer {
  constructor(latlng: LatLngExpression, options?: TooltipOptions);
  constructor(options?: DivOverlayOptions, source?: Layer);
  getLatLng(): LatLng | undefined;
  setLatLng(latlng: LatLngExpression): this;
  getContent(): Content | ((source: Layer) => Content) | undefined;
  setContent(htmlContent: ((source: Layer) => Content) | Content): this;
  getElement(): HTMLElement | undefined;
  update(): void;
  isOpen(): boolean;
  bringToFront(): this;
  bringToBack(): this;
  openOn(map: Map): this;
  toggle(layer?: Layer): this;
  close(): this;
  options: DivOverlayOptions;
}
interface PopupOptions extends DivOverlayOptions {
  maxWidth?: number | undefined;
  minWidth?: number | undefined;
  maxHeight?: number | undefined;
  keepInView?: boolean | undefined;
  closeButton?: boolean | undefined;
  autoPan?: boolean | undefined;
  autoPanPaddingTopLeft?: PointExpression | undefined;
  autoPanPaddingBottomRight?: PointExpression | undefined;
  autoPanPadding?: PointExpression | undefined;
  autoClose?: boolean | undefined;
  closeOnClick?: boolean | undefined;
  closeOnEscapeKey?: boolean | undefined;
}
type Content = string | HTMLElement;
declare class Popup extends DivOverlay {
  constructor(latlng: LatLngExpression, options?: TooltipOptions);
  constructor(options?: PopupOptions, source?: Layer);
  openOn(map: Map): this;
  options: PopupOptions;
}
type Direction = "right" | "left" | "top" | "bottom" | "center" | "auto";
interface TooltipOptions extends DivOverlayOptions {
  pane?: string | undefined;
  offset?: PointExpression | undefined;
  direction?: Direction | undefined;
  permanent?: boolean | undefined;
  sticky?: boolean | undefined;
  opacity?: number | undefined;
}
declare class Tooltip extends DivOverlay {
  constructor(latlng: LatLngExpression, options?: TooltipOptions);
  constructor(options?: TooltipOptions, source?: Layer);
  setOpacity(val: number): void;
  options: TooltipOptions;
}
interface ZoomOptions {
  animate?: boolean | undefined;
}
interface PanOptions {
  animate?: boolean | undefined;
  duration?: number | undefined;
  easeLinearity?: number | undefined;
  noMoveStart?: boolean | undefined;
}
// This is not empty, it extends two interfaces into one...
interface ZoomPanOptions extends ZoomOptions, PanOptions {}
interface InvalidateSizeOptions extends ZoomPanOptions {
  debounceMoveend?: boolean | undefined;
  pan?: boolean | undefined;
}
interface FitBoundsOptions extends ZoomOptions, PanOptions {
  paddingTopLeft?: PointExpression | undefined;
  paddingBottomRight?: PointExpression | undefined;
  padding?: PointExpression | undefined;
  maxZoom?: number | undefined;
}
interface PanInsideOptions extends PanOptions {
  paddingTopLeft?: PointExpression | undefined;
  paddingBottomRight?: PointExpression | undefined;
  padding?: PointExpression | undefined;
}
interface LocateOptions {
  watch?: boolean | undefined;
  setView?: boolean | undefined;
  maxZoom?: number | undefined;
  timeout?: number | undefined;
  maximumAge?: number | undefined;
  enableHighAccuracy?: boolean | undefined;
}
declare class Handler extends Class {
  constructor(map: Map);
  enable(): this;
  disable(): this;
  enabled(): boolean;
  // Extension methods
  addHooks?(): void;
  removeHooks?(): void;
}
interface LeafletEvent {
  type: string;
  popup: any;
  target: any;
  sourceTarget: any;
  propagatedFrom: any;
  /**
   * @deprecated The same as {@link LeafletEvent.propagatedFrom propagatedFrom}.
   */
  layer: any;
}
interface LeafletMouseEvent extends LeafletEvent {
  latlng: LatLng;
  layerPoint: Point;
  containerPoint: Point;
  originalEvent: MouseEvent;
}
interface LeafletKeyboardEvent extends LeafletEvent {
  originalEvent: KeyboardEvent;
}
interface LocationEvent extends LeafletEvent {
  latlng: LatLng;
  bounds: LatLngBounds;
  accuracy: number;
  altitude: number;
  altitudeAccuracy: number;
  heading: number;
  speed: number;
  timestamp: number;
}
interface ErrorEvent extends LeafletEvent {
  message: string;
  code: number;
}
interface LayerEvent extends LeafletEvent {
  layer: Layer;
}
interface LayersControlEvent extends LayerEvent {
  name: string;
}
interface TileEvent extends LeafletEvent {
  tile: HTMLImageElement;
  coords: Coords;
}
interface TileErrorEvent extends TileEvent {
  error: Error;
}
interface ResizeEvent extends LeafletEvent {
  oldSize: Point;
  newSize: Point;
}
interface PopupEvent extends LeafletEvent {
  popup: Popup;
}
interface TooltipEvent extends LeafletEvent {
  tooltip: Tooltip;
}
interface DragEndEvent extends LeafletEvent {
  distance: number;
}
interface ZoomAnimEvent extends LeafletEvent {
  center: LatLng;
  zoom: number;
  noUpdate: boolean;
}
interface DefaultMapPanes {
  mapPane: HTMLElement;
  tilePane: HTMLElement;
  overlayPane: HTMLElement;
  shadowPane: HTMLElement;
  markerPane: HTMLElement;
  tooltipPane: HTMLElement;
  popupPane: HTMLElement;
}
declare class Map extends Evented {
  constructor(element: string | HTMLElement, options?: MapOptions);
  getRenderer(layer: Path): Renderer;
  // Methods for layers and controls
  addControl(control: Control): this;
  removeControl(control: Control): this;
  addLayer(layer: Layer): this;
  removeLayer(layer: Layer): this;
  hasLayer(layer: Layer): boolean;
  eachLayer(fn: (layer: Layer) => void, context?: any): this;
  openPopup(popup: Popup): this;
  openPopup(content: Content, latlng: LatLngExpression, options?: PopupOptions): this;
  closePopup(popup?: Popup): this;
  openTooltip(tooltip: Tooltip): this;
  openTooltip(content: Content, latlng: LatLngExpression, options?: TooltipOptions): this;
  closeTooltip(tooltip?: Tooltip): this;
  // Methods for modifying map state
  setView(center: LatLngExpression, zoom?: number, options?: ZoomPanOptions): this;
  setZoom(zoom: number, options?: ZoomPanOptions): this;
  zoomIn(delta?: number, options?: ZoomOptions): this;
  zoomOut(delta?: number, options?: ZoomOptions): this;
  setZoomAround(position: Point | LatLngExpression, zoom: number, options?: ZoomOptions): this;
  fitBounds(bounds: LatLngBoundsExpression, options?: FitBoundsOptions): this;
  fitWorld(options?: FitBoundsOptions): this;
  panTo(latlng: LatLngExpression, options?: PanOptions): this;
  panBy(offset: PointExpression, options?: PanOptions): this;
  setMaxBounds(bounds?: LatLngBoundsExpression): this;
  setMinZoom(zoom: number): this;
  setMaxZoom(zoom: number): this;
  panInside(latLng: LatLngExpression, options?: PanInsideOptions): this;
  panInsideBounds(bounds: LatLngBoundsExpression, options?: PanOptions): this;
  /**
   * Boolean for animate or advanced ZoomPanOptions
   */
  invalidateSize(options?: boolean | InvalidateSizeOptions): this;
  stop(): this;
  flyTo(latlng: LatLngExpression, zoom?: number, options?: ZoomPanOptions): this;
  flyToBounds(bounds: LatLngBoundsExpression, options?: FitBoundsOptions): this;
  // Other methods
  addHandler(name: string, HandlerClass: typeof Handler): this; // Alternatively, HandlerClass: new(map: Map) => Handler
  remove(): this;
  createPane(name: string, container?: HTMLElement): HTMLElement;
  /**
   * Name of the pane or the pane as HTML-Element
   */
  getPane(pane: string | HTMLElement): HTMLElement | undefined;
  getPanes(): {
    [name: string]: HTMLElement;
  } & DefaultMapPanes;
  getContainer(): HTMLElement;
  whenReady(fn: (event: {
    target: Map;
  }) => void, context?: any): this;
  // Methods for getting map state
  getCenter(): LatLng;
  getZoom(): number;
  getBounds(): LatLngBounds;
  getMinZoom(): number;
  getMaxZoom(): number;
  getBoundsZoom(bounds: LatLngBoundsExpression, inside?: boolean, padding?: Point): number;
  getSize(): Point;
  getPixelBounds(): Bounds;
  getPixelOrigin(): Point;
  getPixelWorldBounds(zoom?: number): Bounds;
  // Conversion methods
  getZoomScale(toZoom: number, fromZoom?: number): number;
  getScaleZoom(scale: number, fromZoom?: number): number;
  project(latlng: LatLngExpression, zoom?: number): Point;
  unproject(point: PointExpression, zoom?: number): LatLng;
  layerPointToLatLng(point: PointExpression): LatLng;
  latLngToLayerPoint(latlng: LatLngExpression): Point;
  wrapLatLng(latlng: LatLngExpression): LatLng;
  wrapLatLngBounds(bounds: LatLngBounds): LatLngBounds;
  distance(latlng1: LatLngExpression, latlng2: LatLngExpression): number;
  containerPointToLayerPoint(point: PointExpression): Point;
  containerPointToLatLng(point: PointExpression): LatLng;
  layerPointToContainerPoint(point: PointExpression): Point;
  latLngToContainerPoint(latlng: LatLngExpression): Point;
  mouseEventToContainerPoint(ev: MouseEvent): Point;
  mouseEventToLayerPoint(ev: MouseEvent): Point;
  mouseEventToLatLng(ev: MouseEvent): LatLng;
  // Geolocation methods
  locate(options?: LocateOptions): this;
  stopLocate(): this;
  // Properties
  attributionControl: L.Control.Attribution;
  boxZoom: Handler;
  doubleClickZoom: Handler;
  dragging: Handler;
  keyboard: Handler;
  scrollWheelZoom: Handler;
  tapHold?: Handler | undefined;
  touchZoom: Handler;
  zoomControl: Control.Zoom;
  options: MapOptions;
}
/**
 * ID of a HTML-Element as string or the HTML-ELement itself
 */
export declare function map(element: string | HTMLElement, options?: MapOptions): Map;
//#endregion