import {dom, Disposable, Observable, computed} from 'grainjs';
import {IObservable} from 'grainjs';

// Vous devrez créer des classes GrainJS pour ces composants.
// Par exemple, VDbChart pourrait être une classe qui étend Disposable et gère son propre DOM.
import {VDbChart} from './VDbChart/VDbChart';
import {VDbStructure} from './VDbStructure';

// Les observables qui agissent comme un 'store' global pour l'éditeur et le graphique.
// En pratique, ces observables seraient gérés par un singleton ou un service dans votre application.
import {editorStore, chartStore} from '../store';

/**
 * Ce composant affiche le diagramme du schéma DBML et les contrôles associés.
 */
class DbmlGraph extends Disposable {
    public readonly root: HTMLElement;

    // L'observable 'schema' est la source de données pour le graphique.
    private readonly _schema: Observable<any>;

    // Observables qui gèrent l'état local du composant.
    private readonly _minScale = observable(10);
    private readonly _maxScale = observable(200);

    // Les 'computed' permettent de lier la logique de mise à l'échelle au 'store'.
    private readonly _scale: IObservable<number>;

    constructor(options: {schema: Observable<any>}) {
        super();
        this._schema = options.schema;

        // Le computed gère la logique de conversion entre le zoom (0-1) et l'échelle (10-200).
        this._scale = computed((use) => Math.round(use(chartStore.zoom) * 100));

        // On utilise 'dom' pour créer la structure HTML du composant.
        this.root = dom('div.dbml-graph-wrapper',
            // Le graphique
            dom.maybe(this._schema, (schema) => 
                dom.maybe(chartStore.loaded, (loaded) => 
                    loaded ? dom.create(VDbChart, schema, {
                        onDblclickTable: (e, thing) => this.locateInEditor(thing),
                        onDblclickField: (e, thing) => this.locateInEditor(thing),
                        onDblclickRef: (e, thing) => this.locateInEditor(thing),
                    }) : null
                )
            ),

            // La structure de la base de données (cachée par défaut avec `v-if="false"`)
            dom('div.dbml-structure-wrapper', { style: 'display: none;' },
                dom('div.q-card.shadow-6',
                    dom.maybe(editorStore.database.schemas, (schemas) => 
                        schemas ? dom.create(VDbStructure, editorStore.database) : null
                    )
                )
            ),

            // La barre d'outils
            dom('div.dbml-toolbar-wrapper',
                dom('div.q-card.shadow-6',
                    dom('div.q-toolbar.rounded-borders',
                        dom('div.q-btn.q-mr-xs.q-px-md', {class: 'secondary'},
                            dom.on('click', () => this.applyAutoLayout()),
                            'Auto-Layout'
                        ),
                        dom('div.q-btn.q-mx-xs.q-px-md', {class: 'secondary'},
                            dom.on('click', () => this.applyScaleToFit()),
                            'fit'
                        ),
                        dom('div.q-space'),
                        dom('div.q-slider.q-mx-sm',
                             // On lie le slider à l'observable. `dom.on('input', ...)` permet d'écouter les changements.
                            dom.prop('value', this._scale),
                            dom.prop('min', this._minScale),
                            dom.prop('max', this._maxScale),
                            dom.on('input', (e) => chartStore.updateZoom(e.target.value / 100)),
                            { style: 'width: 25%; min-width: 100px; max-width: 200px;' }
                        ),
                        dom('div.q-mx-sm.non-selectable',
                            dom.style('width', '2.5rem'),
                            dom.style('flex', '0 0 auto'),
                            dom.text((use) => `${Math.round(use(this._scale))} %`)
                        )
                    )
                )
            )
        );
    }
    
    // Remplacement de la méthode locateInEditor
    private locateInEditor(thing: any) {
        if (thing?.token) {
            const token = thing.token;
            // On appelle la méthode du store pour mettre à jour la sélection.
            editorStore.updateSelectionMarker(token.start, token.end);
        }
    }

    private applyAutoLayout() {
        // Logique pour l'auto-layout
    }

    private applyScaleToFit() {
        // Logique pour l'échelle ajustée
    }
}

// Les styles sont les mêmes, donc pas de traduction nécessaire.
// Il suffit de les inclure dans votre CSS.