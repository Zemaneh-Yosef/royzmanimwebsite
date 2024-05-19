
    /**
     * Chop up text into flows
     * @class
     */
    export class Chunker {
        constructor(content: any, renderTo: any, options: any);
        settings: any;
        hooks: {};
        pages: any[];
        total: number;
        q: Queue;
        stopped: boolean;
        rendered: boolean;
        content: any;
        charsPerBreak: any[];
        setup(renderTo: any): void;
        pagesArea: HTMLDivElement;
        pageTemplate: HTMLTemplateElement;
        flow(content: any, renderTo: any): Promise<this>;
        source: ContentParser;
        breakToken: any;
        render(parsed: any, startAt: any): Promise<any>;
        start(): void;
        stop(): void;
        renderOnIdle(renderer: any): any;
        renderAsync(renderer: any): Promise<any>;
        handleBreaks(node: any, force: any): Promise<void>;
        layout(content: any, startAt: any): {};
        recoredCharLength(length: any): void;
        maxChars: number;
        removePages(fromIndex?: number): void;
        addPage(blank: any): Page;
        clonePage(originalPage: any): Promise<void>;
        loadFonts(): any;
        destroy(): void;
    }
    export class Handler {
        constructor(chunker: any, polisher: any, caller: any);
        chunker: any;
        polisher: any;
        caller: any;
    }
    export class Polisher {
        constructor(setup: any);
        sheets: any[];
        inserted: any[];
        hooks: {};
        setup(): CSSStyleSheet;
        base: HTMLStyleElement;
        styleEl: HTMLStyleElement;
        styleSheet: CSSStyleSheet;
        add(...args: any[]): Promise<any>;
        convertViaSheet(cssStr: any, href: any): Promise<any>;
        width: any;
        height: any;
        orientation: any;
        insert(text: any): HTMLStyleElement;
        destroy(): void;
    }
    export class Previewer {
        constructor(options: any);
        settings: any;
        polisher: Polisher;
        chunker: Chunker;
        hooks: {};
        size: {
            width: {
                value: number;
                unit: string;
            };
            height: {
                value: number;
                unit: string;
            };
            format: any;
            orientation: any;
        };
        initializeHandlers(): Handlers;
        atpages: any;
        registerHandlers(...args: any[]): any;
        getParams(name: any): any;
        wrapContent(): any;
        removeStyles(doc?: Document): any[];
        preview(content: any, stylesheets: any, renderTo: any): Promise<Chunker>;
        handlers: Handlers;
    }
    export function initializeHandlers(chunker: any, polisher: any, caller: any): Handlers;
    export function registerHandlers(...args: any[]): void;
    export let registeredHandlers: (typeof AtPage | typeof Breaks | typeof PrintMedia | typeof Splits | typeof Counters | typeof Lists | typeof PositionFixed | typeof PageCounterIncrement | typeof NthOfType | typeof RunningHeaders | typeof StringSets | typeof TargetCounters | typeof TargetText | typeof CommentsFilter)[];
    /**
     * Queue for handling tasks one at a time
     * @class
     * @param {scope} context what this will resolve to in the tasks
     */
    class Queue {
        constructor(context: any);
        _q: any[];
        context: any;
        tick: typeof requestAnimationFrame;
        running: boolean;
        paused: boolean;
        /**
         * Add an item to the queue
         * @return {Promise} enqueued
         */
        enqueue(...args: any[]): Promise<any>;
        /**
         * Run one item
         * @return {Promise} dequeued
         */
        dequeue(): Promise<any>;
        dump(): void;
        /**
         * Run all tasks sequentially, at convince
         * @return {Promise} all run
         */
        run(): Promise<any>;
        defered: defer;
        /**
         * Flush all, as quickly as possible
         * @return {Promise} ran
         */
        flush(): Promise<any>;
        /**
         * Clear all items in wait
         * @return {void}
         */
        clear(): void;
        /**
         * Get the number of tasks in the queue
         * @return {number} tasks
         */
        length(): number;
        /**
         * Pause a running queue
         * @return {void}
         */
        pause(): void;
        /**
         * End the queue
         * @return {void}
         */
        stop(): void;
    }
    /**
     * Render a flow of text offscreen
     * @class
     */
    class ContentParser {
        constructor(content: any, cb: any);
        dom: any;
        parse(markup: any, mime: any): DocumentFragment;
        add(contents: any): any;
        addRefs(content: any): void;
        find(ref: any): any;
        destroy(): void;
        refs: any;
    }
    /**
     * Render a page
     * @class
     */
    class Page {
        constructor(pagesArea: any, pageTemplate: any, blank: any, hooks: any, options: any);
        pagesArea: any;
        pageTemplate: any;
        blank: any;
        width: number;
        height: number;
        hooks: any;
        settings: any;
        create(template: any, after: any): any;
        element: any;
        pagebox: any;
        area: any;
        footnotesArea: any;
        createWrapper(): HTMLDivElement;
        wrapper: HTMLDivElement;
        index(pgnum: any): void;
        position: any;
        id: string;
        layout(contents: any, breakToken: any, prevPage: any): Promise<any>;
        startToken: any;
        layoutMethod: Layout;
        endToken: any;
        append(contents: any, breakToken: any): Promise<any>;
        getByParent(ref: any, entries: any): any;
        onOverflow(func: any): void;
        _onOverflow: any;
        onUnderflow(func: any): void;
        _onUnderflow: any;
        clear(): void;
        addListeners(contents: any): boolean;
        _checkOverflowAfterResize: any;
        _onScroll: any;
        listening: boolean;
        removeListeners(): void;
        addResizeObserver(contents: any): void;
        ro: ResizeObserver;
        checkOverflowAfterResize(contents: any): void;
        checkUnderflowAfterResize(contents: any): void;
        destroy(): void;
    }
    class Handlers {
        constructor(chunker: any, polisher: any, caller: any);
    }
    class AtPage extends Handler {
        pages: {};
        width: any;
        height: any;
        orientation: any;
        marginalia: {};
        pageModel(selector: any): {
            selector: any;
            name: any;
            psuedo: any;
            nth: any;
            marginalia: {};
            width: any;
            height: any;
            orientation: any;
            margin: {
                top: {};
                right: {};
                left: {};
                bottom: {};
            };
            padding: {
                top: {};
                right: {};
                left: {};
                bottom: {};
            };
            border: {
                top: {};
                right: {};
                left: {};
                bottom: {};
            };
            backgroundOrigin: any;
            block: {};
            marks: any;
            notes: any;
            added: boolean;
        };
        onAtPage(node: any, item: any, list: any): void;
        afterTreeWalk(ast: any, sheet: any): void;
        format: any;
        getTypeSelector(ast: any): undefined;
        getPsuedoSelector(ast: any): undefined;
        getNthSelector(ast: any): undefined;
        replaceMarginalia(ast: any): {};
        replaceNotes(ast: any): {};
        replaceDeclarations(ast: any): {};
        getSize(declaration: any): {
            width: undefined;
            height: undefined;
            orientation: undefined;
            format: undefined;
        };
        getMargins(declaration: any): {
            top: {};
            right: {};
            left: {};
            bottom: {};
        };
        getPaddings(declaration: any): {
            top: {};
            right: {};
            left: {};
            bottom: {};
        };
        getBorders(declaration: any): {
            top: {};
            right: {};
            left: {};
            bottom: {};
        };
        addPageClasses(pages: any, ast: any, sheet: any): void;
        createPage(page: any, ruleList: any, sheet: any): {
            type: string;
            prelude: {
                type: string;
                children: any;
            };
            block: any;
        };
        addMarginVars(margin: any, list: any, item: any): void;
        addPaddingVars(padding: any, list: any, item: any): void;
        addBorderVars(border: any, list: any, item: any): void;
        addDimensions(width: any, height: any, orientation: any, list: any, item: any): void;
        addMarginaliaStyles(page: any, list: any, item: any, sheet: any): void;
        addMarginaliaContent(page: any, list: any, item: any, sheet: any): void;
        addRootVars(ast: any, width: any, height: any, orientation: any, bleed: any, bleedrecto: any, bleedverso: any, marks: any): void;
        addNotesStyles(notes: any, page: any, list: any, item: any, sheet: any): void;
        addRootPage(ast: any, size: any, bleed: any, bleedrecto: any, bleedverso: any): void;
        getNth(nth: any): {
            type: string;
            loc: any;
            selector: any;
            nth: {
                type: string;
                loc: any;
                a: any;
                b: any;
            };
        };
        addPageAttributes(page: any, start: any, pages: any): void;
        getStartElement(content: any, breakToken: any): any;
        beforePageLayout(page: any, contents: any, breakToken: any, chunker: any): void;
        afterPageLayout(page: any, contents: any, breakToken: any, chunker: any): void;
        finalizePage(fragment: any, page: any, breakToken: any, chunker: any): void;
        selectorsForPage(page: any): any;
        selectorsForPageMargin(page: any, margin: any): any;
        createDeclaration(property: any, value: any, important: any): {
            type: string;
            loc: any;
            important: any;
            property: any;
            value: {
                type: string;
                loc: any;
                children: any;
            };
        };
        createVariable(property: any, value: any): {
            type: string;
            loc: any;
            property: any;
            value: {
                type: string;
                value: any;
            };
        };
        createCalculatedDimension(property: any, items: any, important: any, operator?: string): {
            type: string;
            loc: any;
            important: any;
            property: any;
            value: {
                type: string;
                loc: any;
                children: any;
            };
        };
        createDimension(property: any, cssValue: any, important: any): {
            type: string;
            loc: any;
            important: any;
            property: any;
            value: {
                type: string;
                loc: any;
                children: any;
            };
        };
        createBlock(declarations: any): {
            type: string;
            loc: any;
            children: any;
        };
        createRule(selectors: any, block: any): {
            type: string;
            prelude: {
                type: string;
                children: any;
            };
            block: any;
        };
    }
    class Breaks extends Handler {
        breaks: {};
        onDeclaration(declaration: any, dItem: any, dList: any, rule: any): void;
        afterParsed(parsed: any): void;
        processBreaks(parsed: any, breaks: any): void;
        mergeBreaks(pageBreaks: any, newBreaks: any): any;
        addBreakAttributes(pageElement: any, page: any): void;
        afterPageLayout(pageElement: any, page: any): void;
    }
    class PrintMedia extends Handler {
        onAtMedia(node: any, item: any, list: any): void;
        getMediaName(node: any): any[];
    }
    class Splits extends Handler {
        afterPageLayout(pageElement: any, page: any, breakToken: any, chunker: any): void;
        handleAlignment(node: any): void;
    }
    class Counters extends Handler {
        styleSheet: any;
        counters: {};
        resetCountersMap: any;
        onDeclaration(declaration: any, dItem: any, dList: any, rule: any): void;
        afterParsed(parsed: any): void;
        addCounter(name: any): any;
        handleIncrement(declaration: any, rule: any): any[];
        handleReset(declaration: any, rule: any): void;
        processCounters(parsed: any, counters: any): void;
        scopeCounters(counters: any): void;
        insertRule(rule: any): void;
        processCounterIncrements(parsed: any, counter: any): void;
        processCounterResets(parsed: any, counter: any): void;
        addCounterValues(parsed: any, counter: any): void;
        addFootnoteMarkerCounter(list: any): void;
        incrementCounterForElement(element: any, incrementArray: any): void;
        /**
         * Merge multiple values of a counter-increment CSS rule, using the specified operator.
         *
         * @param {Array} incrementArray the values to merge, e.g. ['c1 1', 'c1 -7 c2 1']
         * @param {Function} operator the function used to merge counter values (e.g. keep the last value of a counter or sum
         *					the counter values)
         * @return {string} the merged value of the counter-increment CSS rule
         */
        mergeIncrements(incrementArray: any[], operator: Function): string;
        afterPageLayout(pageElement: any, page: any): void;
    }
    class Lists extends Handler {
        afterParsed(content: any): void;
        afterPageLayout(pageElement: any, page: any, breakToken: any, chunker: any): void;
        addDataNumbers(list: any): void;
    }
    class PositionFixed extends Handler {
        styleSheet: any;
        fixedElementsSelector: any[];
        fixedElements: any[];
        onDeclaration(declaration: any, dItem: any, dList: any, rule: any): void;
        afterParsed(fragment: any): void;
        afterPageLayout(pageElement: any, page: any, breakToken: any): void;
    }
    class PageCounterIncrement extends Handler {
        styleSheet: any;
        pageCounter: {
            name: string;
            increments: {};
            resets: {};
        };
        onDeclaration(declaration: any, dItem: any, dList: any, rule: any): void;
        afterParsed(_: any): void;
        handleIncrement(declaration: any, rule: any): {
            selector: any;
            number: any;
        };
        insertRule(rule: any): void;
    }
    class NthOfType extends Handler {
        styleSheet: any;
        selectors: {};
        onRule(ruleNode: any, ruleItem: any, rulelist: any): void;
        afterParsed(parsed: any): void;
        processSelectors(parsed: any, selectors: any): void;
    }
    class RunningHeaders extends Handler {
        runningSelectors: {};
        elements: {};
        onDeclaration(declaration: any, dItem: any, dList: any, rule: any): void;
        afterParsed(fragment: any): void;
        afterPageLayout(fragment: any): void;
        orderedSelectors: any[];
        /**
        * Assign a weight to @page selector classes
        * 1) page
        * 2) left & right
        * 3) blank
        * 4) first & nth
        * 5) named page
        * 6) named left & right
        * 7) named first & nth
        * @param {string} [s] selector string
        * @return {Number} weight
        */
        pageWeight(s?: string): number;
        /**
        * Orders the selectors based on weight
        *
        * Does not try to deduplicate base on specifity of the selector
        * Previous matched selector will just be overwritten
        * @param {obj} [obj] selectors object
        * @return {Array} orderedSelectors
        */
        orderSelectors(obj?: any): any[];
        beforeTreeParse(text: any, sheet: any): void;
    }
    class StringSets extends Handler {
        stringSetSelectors: {};
        onDeclaration(declaration: any, dItem: any, dList: any, rule: any): void;
        onContent(funcNode: any, fItem: any, fList: any, declaration: any, rule: any): void;
        type: any;
        afterPageLayout(fragment: any): void;
        pageLastString: {};
    }
    class TargetCounters extends Handler {
        styleSheet: any;
        counterTargets: {};
        onContent(funcNode: any, fItem: any, fList: any, declaration: any, rule: any): void;
        afterPageLayout(fragment: any, page: any, breakToken: any, chunker: any): void;
    }
    class TargetText extends Handler {
        styleSheet: any;
        textTargets: {};
        beforeContent: string;
        afterContent: string;
        selector: {};
        onContent(funcNode: any, fItem: any, fList: any, declaration: any, rule: any): void;
        onPseudoSelector(pseudoNode: any, pItem: any, pList: any, selector: any, rule: any): void;
        afterParsed(fragment: any): void;
    }
    class CommentsFilter extends Handler {
        filter(content: any): void;
    }
    /**
     * Creates a new pending promise and provides methods to resolve or reject it.
     * From: https://developer.mozilla.org/en-US/docs/Mozilla/JavaScript_code_modules/Promise.jsm/Deferred#backwards_forwards_compatible
     * @returns {object} defered
     */
    function defer(): object;
    class defer {
        resolve: any;
        reject: any;
        id: string;
        promise: any;
    }
    /**
     * Layout
     * @class
     */
    class Layout {
        constructor(element: any, hooks: any, options: any);
        element: any;
        bounds: any;
        parentBounds: any;
        gap: number;
        hooks: any;
        settings: any;
        maxChars: any;
        forceRenderBreak: boolean;
        renderTo(wrapper: any, source: any, breakToken: any, prevPage?: any, bounds?: any): Promise<RenderResult>;
        failed: boolean;
        breakAt(node: any, offset?: number, forcedBreakQueue?: any[]): BreakToken;
        shouldBreak(node: any, limiter: any): boolean;
        forceBreak(): void;
        getStart(source: any, breakToken: any): any;
        /**
         * Merge items from source into dest which don't yet exist in dest.
         *
         * @param {Element} dest
         *   A destination DOM node tree.
         * @param {Element} source
         *   A source DOM node tree.
         *
         * @returns {void}
         */
        addOverflowNodes(dest: Element, source: Element): void;
        /**
         * Add overflow to new page.
         *
         * @param {Element} dest
         *   The page content being built.
         * @param {breakToken} breakToken
         *   The current break cotent.
         * @param {Element} alreadyRendered
         *   The content that has already been rendered.
         *
         * @returns {void}
         */
        addOverflowToPage(dest: Element, breakToken: any, alreadyRendered: Element): void;
        /**
         * Add text to new page.
         *
         * @param {Element} node
         *   The node being appended to the destination.
         * @param {Element} dest
         *   The destination to which content is being added.
         * @param {breakToken} breakToken
         *   The current breakToken.
         * @param {boolean} shallow
         *	 Whether to do a shallow copy of the node.
         * @param {boolean} rebuild
         *   Whether to rebuild parents.
         *
         * @returns {ChildNode}
         *   The cloned node.
         */
        append(node: Element, dest: Element, breakToken: any, shallow?: boolean, rebuild?: boolean): ChildNode;
        rebuildTableFromBreakToken(breakToken: any, dest: any): void;
        waitForImages(imgs: any): Promise<void>;
        awaitImageLoaded(image: any): Promise<any>;
        avoidBreakInside(node: any, limiter: any): any;
        createOverflow(overflow: any, rendered: any, source: any): Overflow;
        lastChildCheck(parentElement: any, rootElement: any): void;
        processOverflowResult(ranges: any, rendered: any, source: any, bounds: any, prevBreakToken: any, node: any, extract: any): undefined;
        findBreakToken(rendered: any, source: any, bounds: any, prevBreakToken: any, node?: any, extract?: boolean): undefined;
        /**
         * Does the element exceed the bounds?
         *
         * @param {Element} element
         *   The element being constrained.
         * @param {array} bounds
         *   The bounding element.
         *
         * @returns {boolean}
         *   Whether the element is within bounds.
         */
        hasOverflow(element: Element, bounds?: any[]): boolean;
        /**
         * Returns the first child that overflows the bounds.
         *
         * There may be no children that overflow (the height might be extended
         * by a sibling). In this case, this function returns NULL.
         *
         * @param {node} node
         *   The parent node of the children we are searching.
         * @param {array} bounds
         *   The bounds of the page area.
         * @returns {ChildNode | null | undefined}
         *   The first overflowing child within the node.
         */
        firstOverflowingChild(node: {
            AnPlusB: {
                name: string;
                structure: {
                    a: StringConstructor[];
                    b: StringConstructor[];
                };
                parse: () => {
                    type: string;
                    loc: any;
                    a: any;
                    b: any;
                };
                generate: (node: any) => void;
            };
            Atrule: {
                name: string;
                structure: {
                    name: StringConstructor;
                    prelude: string[];
                    block: string[];
                };
                parse: () => {
                    type: string;
                    loc: any;
                    name: any;
                    prelude: any;
                    block: any;
                };
                generate: (node: any) => void;
                walkContext: string;
            };
            AtrulePrelude: {
                name: string;
                structure: {
                    children: any[][];
                };
                parse: (name: any) => {
                    type: string;
                    loc: any;
                    children: any;
                };
                generate: (node: any) => void;
                walkContext: string;
            };
            AttributeSelector: {
                name: string;
                structure: {
                    name: string;
                    matcher: StringConstructor[];
                    value: string[];
                    flags: StringConstructor[];
                };
                parse: () => {
                    type: string;
                    loc: any;
                    name: any;
                    matcher: any;
                    value: any;
                    flags: any;
                };
                generate: (node: any) => void;
            };
            Block: {
                name: string;
                structure: {
                    children: string[][];
                };
                parse: (isDeclaration: any) => {
                    type: string;
                    loc: any;
                    children: any;
                };
                generate: (node: any) => void;
                walkContext: string;
            };
            Brackets: {
                name: string;
                structure: {
                    children: any[][];
                };
                parse: (readSequence: any, recognizer: any) => {
                    type: string;
                    loc: any;
                    children: any;
                };
                generate: (node: any) => void;
            };
            CDC: {
                name: string;
                structure: any[];
                parse: () => {
                    type: string;
                    loc: any;
                };
                generate: () => void;
            };
            CDO: {
                name: string;
                structure: any[];
                parse: () => {
                    type: string;
                    loc: any;
                };
                generate: () => void;
            };
            ClassSelector: {
                name: string;
                structure: {
                    name: StringConstructor;
                };
                parse: () => {
                    type: string;
                    loc: any;
                    name: any;
                };
                generate: (node: any) => void;
            };
            Combinator: {
                name: string;
                structure: {
                    name: StringConstructor;
                };
                parse: () => {
                    type: string;
                    loc: any;
                    name: any;
                };
                generate: (node: any) => void;
            };
            Comment: {
                name: string;
                structure: {
                    value: StringConstructor;
                };
                parse: () => {
                    type: string;
                    loc: any;
                    value: any;
                };
                generate: (node: any) => void;
            };
            Declaration: {
                name: string;
                structure: {
                    important: (StringConstructor | BooleanConstructor)[];
                    property: StringConstructor;
                    value: string[];
                };
                parse: () => {
                    type: string;
                    loc: any;
                    important: boolean;
                    property: any;
                    value: any;
                };
                generate: (node: any) => void;
                walkContext: string;
            };
            DeclarationList: {
                name: string;
                structure: {
                    children: string[][];
                };
                parse: () => {
                    type: string;
                    loc: any;
                    children: any;
                };
                generate: (node: any) => void;
            };
            Dimension: {
                name: string;
                structure: {
                    value: StringConstructor;
                    unit: StringConstructor;
                };
                parse: () => {
                    type: string;
                    loc: any;
                    value: any;
                    unit: any;
                };
                generate: (node: any) => void;
            };
            Function: {
                name: string;
                structure: {
                    name: StringConstructor;
                    children: any[][];
                };
                parse: (readSequence: any, recognizer: any) => {
                    type: string;
                    loc: any;
                    name: any;
                    children: any;
                };
                generate: (node: any) => void;
                walkContext: string;
            };
            Hash: {
                name: string;
                structure: {
                    value: StringConstructor;
                };
                parse: () => {
                    type: string;
                    loc: any;
                    value: any;
                };
                generate: (node: any) => void;
            };
            Identifier: {
                name: string;
                structure: {
                    name: StringConstructor;
                };
                parse: () => {
                    type: string;
                    loc: any;
                    name: any;
                };
                generate: (node: any) => void;
            };
            IdSelector: {
                name: string;
                structure: {
                    name: StringConstructor;
                };
                parse: () => {
                    type: string;
                    loc: any;
                    name: any;
                };
                generate: (node: any) => void;
            };
            MediaFeature: {
                name: string;
                structure: {
                    name: StringConstructor;
                    value: string[];
                };
                parse: () => {
                    type: string;
                    loc: any;
                    name: any;
                    value: any;
                };
                generate: (node: any) => void;
            };
            MediaQuery: {
                name: string;
                structure: {
                    children: string[][];
                };
                parse: () => {
                    type: string;
                    loc: any;
                    children: any;
                };
                generate: (node: any) => void;
            };
            MediaQueryList: {
                name: string;
                structure: {
                    children: string[][];
                };
                parse: (relative: any) => {
                    type: string;
                    loc: any;
                    children: any;
                };
                generate: (node: any) => void;
            };
            Nth: {
                name: string;
                structure: {
                    nth: string[];
                    selector: string[];
                };
                parse: (allowOfClause: any) => {
                    type: string;
                    loc: any;
                    nth: any;
                    selector: any;
                };
                generate: (node: any) => void;
            };
            Number: {
                name: string;
                structure: {
                    value: StringConstructor;
                };
                parse: () => {
                    type: string;
                    loc: any;
                    value: any;
                };
                generate: (node: any) => void;
            };
            Operator: {
                name: string;
                structure: {
                    value: StringConstructor;
                };
                parse: () => {
                    type: string;
                    loc: any;
                    value: any;
                };
                generate: (node: any) => void;
            };
            Parentheses: {
                name: string;
                structure: {
                    children: any[][];
                };
                parse: (readSequence: any, recognizer: any) => {
                    type: string;
                    loc: any;
                    children: any;
                };
                generate: (node: any) => void;
            };
            Percentage: {
                name: string;
                structure: {
                    value: StringConstructor;
                };
                parse: () => {
                    type: string;
                    loc: any;
                    value: any;
                };
                generate: (node: any) => void;
            };
            PseudoClassSelector: {
                name: string;
                structure: {
                    name: StringConstructor;
                    children: string[][];
                };
                parse: () => {
                    type: string;
                    loc: any;
                    name: any;
                    children: any;
                };
                generate: (node: any) => void;
                walkContext: string;
            };
            PseudoElementSelector: {
                name: string;
                structure: {
                    name: StringConstructor;
                    children: string[][];
                };
                parse: () => {
                    type: string;
                    loc: any;
                    name: any;
                    children: any;
                };
                generate: (node: any) => void;
                walkContext: string;
            };
            Ratio: {
                name: string;
                structure: {
                    left: StringConstructor;
                    right: StringConstructor;
                };
                parse: () => {
                    type: string;
                    loc: any;
                    left: any;
                    right: any;
                };
                generate: (node: any) => void;
            };
            Raw: {
                name: string;
                structure: {
                    value: StringConstructor;
                };
                parse: (startToken: any, mode: any, excludeWhiteSpace: any) => {
                    type: string;
                    loc: any;
                    value: any;
                };
                generate: (node: any) => void;
                mode: {
                    default: typeof balanceEnd;
                    leftCurlyBracket: typeof leftCurlyBracket;
                    leftCurlyBracketOrSemicolon: typeof leftCurlyBracketOrSemicolon;
                    exclamationMarkOrSemicolon: typeof exclamationMarkOrSemicolon;
                    semicolonIncluded: typeof semicolonIncluded;
                };
            };
            Rule: {
                name: string;
                structure: {
                    prelude: string[];
                    block: string[];
                };
                parse: () => {
                    type: string;
                    loc: any;
                    prelude: any;
                    block: any;
                };
                generate: (node: any) => void;
                walkContext: string;
            };
            Selector: {
                name: string;
                structure: {
                    children: string[][];
                };
                parse: () => {
                    type: string;
                    loc: any;
                    children: any;
                };
                generate: (node: any) => void;
            };
            SelectorList: {
                name: string;
                structure: {
                    children: string[][];
                };
                parse: () => {
                    type: string;
                    loc: any;
                    children: any;
                };
                generate: (node: any) => void;
                walkContext: string;
            };
            String: {
                name: string;
                structure: {
                    value: StringConstructor;
                };
                parse: () => {
                    type: string;
                    loc: any;
                    value: any;
                };
                generate: (node: any) => void;
            };
            StyleSheet: {
                name: string;
                structure: {
                    children: string[][];
                };
                parse: () => {
                    type: string;
                    loc: any;
                    children: any;
                };
                generate: (node: any) => void;
                walkContext: string;
            };
            TypeSelector: {
                name: string;
                structure: {
                    name: StringConstructor;
                };
                parse: () => {
                    type: string;
                    loc: any;
                    name: any;
                };
                generate: (node: any) => void;
            };
            UnicodeRange: {
                name: string;
                structure: {
                    value: StringConstructor;
                };
                parse: () => {
                    type: string;
                    loc: any;
                    value: any;
                };
                generate: (node: any) => void;
            };
            Url: {
                name: string;
                structure: {
                    value: string[];
                };
                parse: () => {
                    type: string;
                    loc: any;
                    value: any;
                };
                generate: (node: any) => void;
            };
            Value: {
                name: string;
                structure: {
                    children: any[][];
                };
                parse: () => {
                    type: string;
                    loc: any;
                    children: any;
                };
                generate: (node: any) => void;
            };
            WhiteSpace: {
                name: string;
                structure: {
                    value: StringConstructor;
                };
                parse: () => Readonly<{
                    type: "WhiteSpace";
                    loc: any;
                    value: " ";
                }>;
                generate: (node: any) => void;
            };
        }, bounds: any[]): ChildNode | null | undefined;
        startOfOverflow(node: any, bounds: any): any[];
        rowspanNeedsBreakAt(tableRow: any, rendered: any): any;
        findOverflow(rendered: any, bounds: any, source: any): Range[];
        findEndToken(rendered: any, source: any): BreakToken;
        textBreak(node: any, start: any, end: any, vStart: any, vEnd: any): any;
        removeOverflow(overflow: any, breakLetter: any): any;
        hyphenateAtBreak(startContainer: any, breakLetter: any): void;
        equalTokens(a: any, b: any): boolean;
    }
    /**
     * Render result.
     * @class
     */
    class RenderResult {
        constructor(breakToken: any, error: any);
        breakToken: any;
        error: any;
    }
    /**
     * BreakToken
     * @class
     */
    class BreakToken {
        constructor(node: any, overflowArray: any);
        node: any;
        overflow: any;
        finished: boolean;
        breakNeededAt: any[];
        equals(otherBreakToken: any): boolean;
        setFinished(): void;
        isFinished(): boolean;
        addNeedsBreak(needsBreak: any): void;
        getNextNeedsBreak(): any;
        getForcedBreakQueue(): any[];
        setForcedBreakQueue(queue: any): any;
    }
    /**
     * Overflow
     * @class
     */
    class Overflow {
        constructor(node: any, offset: any, overflowHeight: any, range: any);
        node: any;
        offset: any;
        overflowHeight: any;
        range: any;
        equals(otherOffset: any): boolean;
    }
    function balanceEnd(): number;
    function leftCurlyBracket(tokenType: any): 0 | 1;
    function leftCurlyBracketOrSemicolon(tokenType: any): 0 | 1;
    function exclamationMarkOrSemicolon(tokenType: any, source: any, offset: any): 0 | 1;
    function semicolonIncluded(tokenType: any): 0 | 2;