import { observable, computed } from 'grainjs';
import { Parser } from "@dbml/core";
import { throttle } from "lodash";
import { chartStore } from './chart.ts';

interface ParserError {
  location: {
    start: { row: number, col: number },
    end: { row: number, col: number }
  };
  type: string;
  message: string;
}

/**
 * Manages the state and logic for the DBML editor.
 */
export class EditorStore {
  public readonly source = observable({
    format: "dbml",
    text: "",
    markers: {
      selection: {
        start: { row: null, col: null },
        end: { row: null, col: null }
      }
    }
  });

  public readonly database = observable({
    schemas: [{ tables: [], refs: [] }]
  });

  public readonly preferences = observable({
    dark: false,
    theme: "dracula",
    split: 25.0
  });

  public readonly parserError = observable<ParserError | undefined>(undefined);

  public readonly getSourceText = computed((use) => use(this.source).text);
  public readonly getTheme = computed((use) => use(this.preferences).theme);
  public readonly getDatabase = computed((use) => use(this.database));
  public readonly getDark = computed((use) => use(this.preferences).dark);

  public updateSourceText(sourceText: string) {
    if (sourceText === this.source.get().text) return;
    this.source.update(val => ({ ...val, text: sourceText }));
    this.updateDatabase();
  }

  public updateSelectionMarker(start: { row: number, col: number }, end: { row: number, col: number }) {
    this.source.update(val => ({ ...val, markers: { selection: { start, end } } }));
  }

  public updateTheme(theme: string) {
    this.preferences.update(val => ({ ...val, theme }));
  }

  public clearParserError() {
    this.parserError.set(undefined);
  }

  public updateParserError(err: any) {
    if (err) {
      this.parserError.set({
        location: {
          start: { row: err.location.start.line - 1, col: err.location.start.column - 1 },
          end: { row: err.location.end.line - 1, col: err.location.end.column - 1 }
        },
        type: 'error',
        message: err.message
      });
    } else {
      this.parserError.set(undefined);
    }
  }

  public updateDatabase = throttle(() => {
    console.log("updating database...");
    try {
      const dbmlText = this.source.get().text;
      const database = Parser.parse(dbmlText, this.source.get().format);
      database.normalize();
      this.database.set(database);
      this.clearParserError();
      chartStore.loadDatabase(database);
      console.log("updated database");
    } catch (e: any) {
      console.error(e);
      this.updateParserError(e);
    }
  }, 500);
}

export const editorStore = new EditorStore();