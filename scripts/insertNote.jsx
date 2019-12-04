#target indesign

if(app.documents.length && app.selection.length && app.selection[0] instanceof InsertionPoint) {
  app.doScript(main, ScriptLanguage.JAVASCRIPT , undefined, UndoModes.ENTIRE_SCRIPT, "Insert Note");
}

function main() {
  var sel = app.selection[0];

  // check if the previous character already contains a note
  // only add note, if this is not the case
  if(!sel.parentStory.characters[sel.index - 1].notes.length) {
    sel.notes.add();
  }
}