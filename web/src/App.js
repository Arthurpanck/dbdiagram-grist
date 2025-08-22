// src/app.js (pas .ts)
import { dom } from 'grainjs';
import { DBDiagramApp } from './components/DBDiagramApp.js';

// Mount direct - pas de layout
dom.update(document.body, DBDiagramApp());