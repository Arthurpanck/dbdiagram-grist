import {dom, Disposable, observable, Observable} from 'grainjs';
import ace, {Ace} from 'ace-builds';
import 'ace-builds/src-noconflict/mode-dbml';
import 'ace-builds/src-noconflict/theme-chrome';
import {Range} from 'ace-builds';

/**
 * A GrainJS component for the DBML Editor.
 */
class DbmlEditor extends Disposable {
    private readonly _root: HTMLElement;
    private readonly _aceEditor: Ace.Editor;
    private readonly _editorElem: HTMLElement;

    // We use observables to manage state that can be shared or updated from outside.
    private readonly _sourceCode: Observable<string>;
    private readonly _theme: Observable<string>;
    private readonly _onUpdate: (value: string) => void;

    // IDs for Ace markers to manage highlighting.
    private _errorMarkerId: number | undefined;
    private _selectionMarkerId: number | undefined;

    /**
     * @param options.source: an observable for the source code.
     * @param options.theme: an observable for the editor theme.
     * @param options.onUpdate: a callback to emit changes to the source code.
     */
    constructor(options: {
        source: Observable<string>,
        theme: Observable<string>,
        onUpdate: (value: string) => void
    }) {
        super();

        // 1. Manage state with observables.
        this._sourceCode = options.source;
        this._theme = options.theme;
        this._onUpdate = options.onUpdate;

        // 2. Build the DOM structure using `dom`.
        this._editorElem = dom('div.dbml-editor');
        this._root = dom('div.dbml-editor-wrapper', this._editorElem);

        // 3. Initialize Ace Editor.
        this._aceEditor = ace.edit(this._editorElem, {
            useWorker: false,
            tabSize: 2,
            enableBasicAutocompletion: true,
            enableLiveAutocompletion: true,
            showPrintMargin: false,
            mode: 'ace/mode/dbml',
            theme: `ace/theme/${this._theme.get()}`
        });

        // 4. Set up editor bindings and subscriptions using `autoDispose`.
        // Sync the observable value to the editor.
        this.autoDispose(this._sourceCode.addListener(value => {
            if (this._aceEditor.getValue() !== value) {
                this._aceEditor.setValue(value, -1);
            }
        }));

        // Sync the theme observable to the editor.
        this.autoDispose(this._theme.addListener(theme => {
            this._aceEditor.setTheme(`ace/theme/${theme}`);
        }));

        // Update the observable when the editor's content changes.
        this._aceEditor.on('change', () => {
            const value = this._aceEditor.getValue();
            this._onUpdate(value);
        });

        // 5. Handle disposal to prevent memory leaks.
        this.onDispose(() => {
            this._aceEditor.destroy();
            this._editorElem.remove();
        });
    }

    public get root(): HTMLElement {
        return this._root;
    }

    /**
     * Highlights a specific token range in the editor.
     */
    public highlightTokenRange(start: {row: number, col: number}, end: {row: number, col: number}) {
        // Clear any previous selection marker.
        if (this._selectionMarkerId !== undefined) {
            this._aceEditor.getSession().removeMarker(this._selectionMarkerId);
        }
        // Remove any error markers to avoid conflicts.
        this.clearAnnotations();

        const range = new Range(start.row, start.col, end.row, end.col);
        this._selectionMarkerId = this._aceEditor.getSession().addMarker(range, 'ace_active-line', 'text');
        this._aceEditor.focus();
    }

    /**
     * Clears all annotations and error markers from the editor.
     */
    public clearAnnotations() {
        this._aceEditor.getSession().clearAnnotations();
        if (this._errorMarkerId !== undefined) {
            this._aceEditor.getSession().removeMarker(this._errorMarkerId);
            this._errorMarkerId = undefined;
        }
    }
}
