/* ------------------------------------------------------------ /
|                                                               |
|   MuTypo.jsx                                                  |
|   ├─ Set up MuTypography layout patterns                      |
|   │                                                           |
|   ├─ Ver: 0.5                                                 |
|   ├─ Author: Timo Rychert                                     |
|   ├─ Requires: InDesign CS6/CC                                |
|   ├─ Created: 2019-12-03                                      |
|   │                                                           |
|   ├─ Change Log                                               |
|   │  ├─ Ability to run scripts before and after               |
|   │  │  MuTypo script execution                               |
│   │  └─ Use guides on MuTypo layer to define target area      |
|   │                                                           |
|   └─ How to use                                               |
|      ├─ Install by placing into InDesign's Scripts folder.    |
|      ├─ Select the text frame to turn into MuTypography.      |
|      ├─ Insert notes on meaning unit breaks                   |
|      │  (Type > Notes > New Note ...)                         |
|      ├─ Run the script.                                       |
|      └─ Select layout values in the UI.                       |
|                                                               |
/ ------------------------------------------------------------ */


// ---- user settings ---- //

var muFormat = 3;                 // how many lines max per MuGlyph; range from 1-5
var wordsPerMuglyph = 5;          // target count of words per MuGlyph
                                  // set to 0 to set no word limit (does not work if width type is set to "fluid")

var widthType = "fixed";          // "fixed" for fixed width, "fluid" (dependent on word width) or "count" (MuGlyphs per line)
var fixedWidth = "30 mm";         // width of MuGlyphs in the document's currently set units; ignored if widthType is not "fixed"
var muglyphsPerLine = 5;          // count of MuGlyphs per line; ignored if widthType is not "count"

var horGutter = "5 mm";           // horizontal gutter between MuGlyphs
var vertGutter = "10 mm";         // vertical gutter between rows of MuGlyphs
var fitVerticalGutter = false;    // not implemented yet; increases vertical gutter size to have last row reach the bottom of the target area

var applyParaStyle = false;       // wether or not to apply a certain paragraph style to the MuGlyphs
var paraStyleName = "";           // paragraph style to use in the MuGlyphs; set to "name of your paragraph style"
                                  // or to "" if no specific paragraph style should be preselected

var targetPageCurrent = true;     // wether or not to use the current page as target page
var targetPageName = "";          // name of target page to start the MuTypo layout
var targetLayerName = "";         // name of target layer; leave empty to either use existing muTypo layer or create a new one

var underline = false;            // draws an underline between rows of MuGlyphs
var underlineWeight = "1 pt";     // stroke width of underline in pt
var underlineOffset = "0 mm";     // vertical offset in document units; positive value moves line up, negative value down

var autoAddPages = true;          // automatically add new pages, when the text thread runs out of space on the last page
var deleteSourceFrame = false;    // determines wether to delete or keep the original text frame

var rememberSettings = true;      // remember the settings of the GUI dialog


// list scripts that should be run before execution
var runBefore = [];

// list scripts that should be run after execution
var runAfter = [];


// ---- ! Don't change anything below this line ! ---- //

#target indesign

// ---- global vars ---- //
var scriptName = "MuTypo";
var versionNo = "0.5";
var debug = true;
var undo = false;

var userSettings = [];
var myDoc = app.documents.length ? app.documents[0] : null;

var signifiers = [".", "!", "?", ";", ":"];
// var noteSplitting = false;

// ---- run scripts before ---- //
for (var runBeforeCounter = 0; runBeforeCounter < runBefore.length; runBeforeCounter++) {

  if(!File(runBefore[runBeforeCounter].exists)) {
    alert("Error\nThe script \"" + runBefore[runBeforeCounter] + "\" cannot be found. Make sure to move it to the correct folder or remove the script from the runBefore.", undefined, true);
    exit();
  }
  app.doScript(runBefore[runBeforeCounter], ScriptLanguage.JAVASCRIPT);
}

// ---- check pre-conditions ---- //
check(app.documents.length, "you need to have a document open");
check(app.selection.length && (app.selection[0].constructor.name === "TextFrame" || app.selection[0].hasOwnProperty('baseline')), "you need to select a text frame");


// ---- set preferences ---- //
set(myDoc.viewPreferences, "rulerOrigin", RulerOrigin.SPREAD_ORIGIN);
set(app.findGrepPreferences, "findWhat", NothingEnum.nothing);
set(app.changeGrepPreferences, "changeTo", NothingEnum.nothing);


// ---- main function ---- //
function main() {

  var sourceStory = app.selection[0].parentStory;
  var sourceTf = sourceStory.textContainers[0];
  var sourceWords = sourceStory.words;

  // get usersettings
  var s = ui(myDoc, sourceTf);

  if(!s) {
    // user cancelled the script
    return;
  }

  // strip units from user inputs
  var fixedWidth = parseFloat(s.fixedWidth);
  var horGutter = parseFloat(s.horGutter);
  var vertGutter = parseFloat(s.vertGutter);
  var underlineWeight = parseFloat(s.underlineWeight);
  var underlineOffset = parseFloat(s.underlineOffset);

  var targetPage = s.targetPageCurrent ? sourceTf.parentPage : myDoc.pages.item(s.targetPageName);

  // Mu infrastructure
  var muLayer;
  if(!s.targetLayerId) {
    // create new layer, make sure name does not conflict with existing mutypo layers
    var mutypoLayer = false;

    for (var i = myDoc.layers.length - 1; i >= 0; i--) {
      if(myDoc.layers[i].name.toLowerCase() === "mutypo") {
        mutypoLayer = true;
        break;
      }
    }

    if(mutypoLayer){
      var ix = 1;
      while(myDoc.layers.item("MuTypo_" + ("0" + ix).slice(-2)).isValid) {
        ix++;
      }
      muLayer = myDoc.layers.add({name: "MuTypo_" + ("0" + ix).slice(-2), layerColor: [255, 158, 97]});
    } else {
      muLayer = myDoc.layers.add({name: "MuTypo", layerColor: [255, 158, 97]});
    }

  } else {
    muLayer = myDoc.layers.item(s.targetLayerName);
  }


  var muTf = sourceTf.duplicate(muLayer);
  muTf.move(targetPage);
  //TODO apply sequenced names to muGlyphs
  muTf.name = "MuTypo_1_1";

  var paraStyle = false;
  if(s.applyParaStyle) {
    var allParaStyles = myDoc.allParagraphStyles;

    for (var i = 0; i < allParaStyles.length; i++) {
      if(allParaStyles[i].id === s.paraStyleId) {
        paraStyle = allParaStyles[i];
        muTf.parentStory.appliedParagraphStyle = paraStyle;
        break;
      }
    }

    if(muTf.parentStory.hyphenation) {
      // if hyphenation is turned on via the paragraph style, still turn it off across columns
      muTf.parentStory.hyphenateAcrossColumns = false;
    }

  } else {
    // set some defaults, if no paragraph style is used
    muTf.parentStory.hyphenation = false;
  }

  var m = getMargins(targetPage, muLayer);
  muTf.geometricBounds = [m.t, m.l, m.b, m.r];

  // get muGlyph height, according to line number
  var muHeight;
  if(muTf.lines.length >= s.muFormat) {
    muHeight = muTf.lines[s.muFormat - 1].baseline - m.t;
  } else {
    // TODO not enough lines / lines are to high
    resizeFrameToLineCount(muTf, s.muFormat)

    if(muTf.lines.length < s.muFormat) {
      userError("Text is to short to calculate height of MuGlyphs. Either use a smaller MuFormat value or a longer text and run the script again.");
    }

    muHeight = muTf.lines[s.muFormat - 1].baseline - m.t;
  }

  if(s.fitVerticalGutter) {
    var muGlyphsPerColumn = Math.floor((m.h + vertGutter) / (muHeight + vertGutter));
    vertGutter = (m.h - (muHeight * muGlyphsPerColumn)) / (muGlyphsPerColumn - 1);
  }

  // calculate muGlyph width
  var muWidth;
  if(s.widthType === "fixed") {
    muWidth = fixedWidth;
    s.muglyphsPerLine = Math.floor((m.w + horGutter) / (muWidth + horGutter));
  } else if (s.widthType === "count") {
    muWidth = (m.w - (horGutter * (s.muglyphsPerLine - 1))) / s.muglyphsPerLine;

    if(muWidth <= 0) {
      userError("The target count of MuGlyphs cannot be placed on the page, as the horizontal gutter value is set too high.\r\rDecrease the horizontal gutter value and run the script again.", undefined, true);
    }
    // return;
  } else {
    muWidth = m.w;
  }


  // ---- split text at notes ---- //

  if(muTf.parentStory.notes.length) {
    noteSplitting = true;

    var muStory = muTf.parentStory;
    var notes = muStory.notes;

    var startIP = muStory.insertionPoints.firstItem();
    var endIP;
    var textSection;

    for (var i = 0; i < notes.length; i++) {

      endIP = notes[i].storyOffset;
      textSection = muStory.insertionPoints.itemByRange(startIP, endIP);

      splitIntoChunks(textSection, s.wordsPerMuglyph);

      endIP = notes[i].storyOffset;
      startIP = muStory.insertionPoints.nextItem(endIP);

    }

    // last part (last note til end of the story) can be skipped

    // remove empty paragraphs or lines, as they can cause problems in the frame splitting process
    changeGrep(muStory, "\\r\\s*\\r", "~R");

  }


  // positioning of initial frame
  muTf.geometricBounds = [m.t, m.l, m.t + muHeight, m.l + muWidth];

  // resize first frame, if width type if fluid
  if(s.widthType === "fluid") {
    muTf.parentStory.composer = "$ID/HL Single";
    resizeFrameByWordCount(muTf, s.wordsPerMuglyph);

    if(muTf.words.length > s.wordsPerMuglyph) {
      frameBreakAfterN(muTf, s.wordsPerMuglyph);
    }
  } else if(/*!noteSplitting && */s.wordsPerMuglyph) {
    // reduce frame contents to word count per MuGlyph
    insertFrameBreak(muTf, s.wordsPerMuglyph);
  }

  // if first frame is empty, it is to small to place even a single word
  if(muTf.words.length === 0) {
    wordFitError(s.widthType, paraStyle, muTf);
  }

  var x = 0;
  var y = 0;
  var top = m.t;

  // while loop until all frames are placed
  var counter = 0;

  while(muTf.overflows) {

    // debuggin only
    // if(++counter === 12) {
    //   return;
    // }

    x++;

    if(x >= s.muglyphsPerLine && s.widthType !== "fluid") {
      // end of line reached, move to next line

      x = 0;
      y++;
      top = m.t + y * (muHeight + vertGutter);

      if(top + muHeight > m.b) {
        // end of page reached, move on to next page
        if(targetPage.documentOffset + 1 === myDoc.documentPreferences.pagesPerDocument) {
          // last page
          if(s.autoAddPages) {
            myDoc.pages.add();
          } else {
            // quit

            // reduce frame contents to word count per MuGlyph
            if(s.wordsPerMuglyph) {
              insertFrameBreak(muTf, s.wordsPerMuglyph);
            }

            return;
          }
        }

        targetPage = myDoc.pages[targetPage.documentOffset + 1];

        // calculate and set values for new page
        m = getMargins(targetPage, muLayer);
        top = m.t;
        y = 0;

        if(s.widthType === "fixed") {
          muWidth = fixedWidth;
          s.muglyphsPerLine = Math.floor((m.w + horGutter) / (muWidth + horGutter));
        } else {
          muWidth = (m.w - (horGutter * (s.muglyphsPerLine - 1))) / s.muglyphsPerLine;
        }

      } else if (s.underline) {
        var ulY = top - vertGutter / 2 - underlineOffset;

        var ul = targetPage.graphicLines.add({
          itemLayer: muLayer,
          strokeWeight: underlineWeight,
        });
        ul.paths.item(0).entirePath = [[m.l, ulY], [muTf.geometricBounds[3], ulY]]
      }

    }

    var left = s.widthType === "fluid" ? (x ? muTf.geometricBounds[3] + horGutter : m.l) : m.l + x * (muWidth + horGutter);

    var prevTf = muTf;
    muTf = targetPage.textFrames.add({
      geometricBounds: [top, left, top + muHeight, left + muWidth],
      name: "MuTypo_1_" + ((x + 1) + y * s.muglyphsPerLine),
      itemLayer: muLayer
    });

    // link text frames
    prevTf.nextTextFrame = muTf;

    if(s.widthType === "fluid") {

      if(muTf.words.length >= s.wordsPerMuglyph) {
        resizeFrameByWordCount(muTf, s.wordsPerMuglyph);
      } else {
        // resize last frame to words within
        resizeFrameByWordCount(muTf, muTf.words.length);
      }

      var muB = muTf.geometricBounds;

      if(muB[3] > m.r) {
        // move frame to a new line
        x = 0;
        y++;
        top = m.t + y * (muHeight + vertGutter);

        if(top + muHeight > m.b) {
          // end of page reached, move on to next page
          if(targetPage.documentOffset + 1 === myDoc.documentPreferences.pagesPerDocument) {
            // last page
            if(s.autoAddPages) {
              myDoc.pages.add();
            } else {
              // quit

              // delete last frame as it is not within the bounds
              muTf.remove();
              return;
            }
          }

          targetPage = myDoc.pages[targetPage.documentOffset + 1];

          // calculate and set values for new page
          m = getMargins(targetPage, muLayer);
          top = m.t;
          y = 0;

          // move text frame over there
          muTf.move(targetPage);

        } else if(s.underline) {
          // if underlines are turned on, add them

          var ulY = top - vertGutter / 2 - underlineOffset;

          var ul = targetPage.graphicLines.add({
            itemLayer: muLayer,
            strokeWeight: underlineWeight,
          });
          ul.paths.item(0).entirePath = [[m.l, ulY], [prevTf.geometricBounds[3], ulY]];
        }

        muTf.geometricBounds = [top, m.l, top + muHeight, m.l + (muB[3] - muB[1])];
      }
    }

    // reduce frame contents to word count per MuGlyph
    if(s.wordsPerMuglyph && (s.widthType !== "fluid")) {
      insertFrameBreak(muTf, s.wordsPerMuglyph);
    }

    // catch issue, where there is a word to long to fit into the text frame
    // (would otherwise result in an infinite creation of empty text frames)
    if(muTf.words.length === 0) {
      wordFitError(s.widthType, paraStyle, muTf, prevTf);
    }

  }

  if(s.deleteSourceFrame) {
    sourceTf.remove();
  }

  myDoc.recompose();

}


// ---- script routine ---- //
app.doScript(init, ScriptLanguage.JAVASCRIPT, undefined, UndoModes.ENTIRE_SCRIPT, scriptName);

if(undo) {
  myDoc.undo();
} else {

  // ---- run scripts after ---- //
  for (var runAfterCounter = 0; runAfterCounter < runAfter.length; runAfterCounter++) {

    if(!File(runAfter[runAfterCounter].exists)) {
      alert("Error\nThe script \"" + runAfter[runAfterCounter] + "\" cannot be found. Make sure to move it to the correct folder or remove the script from the runAfter.", undefined, true);
      exit();
    }

    app.doScript(runAfter[runAfterCounter], ScriptLanguage.JAVASCRIPT);
  }

}

function init () {
  try {
    main(myDoc);

  } catch (e) {
    if(!e.userError){
      var errorAlert = (
        e.name + "\n" +
        e.message + "\n\n" +
        "File: " + e.fileName + "\n\n" +
        "Line: " + e.line
        //+ "\n\nAdditional error message."
        );
    } else {
      var errorAlert = e.message;
    }

    alert(errorAlert);

    if(e.undo) {
      undo = true;
    }

  } finally {
    resetUserSettings(userSettings);
  }
}

function check(condition, errorMsg) {
  var errorMsgPre = "Error\nTo run the script ";
  var errorMsgPost = ".";

  if(!condition) {
    alert(errorMsgPre + errorMsg + errorMsgPost);
    exit();
  }
}

function set(obj, prop, targetValue) {
  userSettings.push([ obj , prop, obj[prop] ]);
  obj[prop] = targetValue;
}

function resetUserSettings(userSettings) {
  for (var i = 0; i < userSettings.length; i++) {
    var us = userSettings[i];
    us[0][us[1]] = us[2];
  }
};


// ---- helper functions ---- //
function runScripts(scriptList) {
  for (var i = 0; i < scriptList.length; i++) {
    var scriptFile = File(scriptList[i]);

    if(!scriptFile.exists) {
      alert("Error\nThe script \"" + scriptList[i] + "\" cannot be found. Make sure to move it to the correct folder or remove the script from the runBefore/runAfter list.", undefined, true);
      exit();
    }

    $.writeln("About to run script " + scriptList[i]);
    app.doScript(scriptList[i], ScriptLanguage.JAVASCRIPT);
  }
}

function resizeFrameByWordCount(tf, wordCount) {
  const GB = tf.geometricBounds,
        MIN = 0,
        MAX = 1000,
        PRECISION = 0.1;

  var a = [MIN, MAX],
      mid;

  while (a[1] - a[0] > PRECISION) {
    mid = (a[0] + a[1]) / 2;
    tf.geometricBounds = [GB[0], GB[1], GB[2], GB[1] + mid];
    a[ +(tf.words.length >= wordCount && tf.words[wordCount - 1].lines[-1].parentTextFrames.length) ] = mid;
  }

  tf.geometricBounds = [GB[0], GB[1], GB[2], GB[1] + a[1]];
};

function resizeFrameToLineCount(tf, lineCount) {
  const GB = tf.geometricBounds,
        MIN = 0,
        MAX = 1000,
        PRECISION = 0.1;

  var a = [MIN, MAX],
      mid;

  while (a[1] - a[0] > PRECISION) {
    mid = (a[0] + a[1]) / 2;
    tf.geometricBounds = [GB[0], GB[1], GB[2], GB[1] + mid];
    a[+(tf.lines.length < lineCount)] = mid;
  }

  tf.geometricBounds = [GB[0], GB[1], GB[2], GB[1] + a[0]];
}

function insertFrameBreak(tf, wordsPerMuglyph) {
  // if last char of frame is already a frame break, return
  if (tf.characters.lastItem().contents === SpecialCharacters.FRAME_BREAK) {
    return;
  }
  if (tf.words.length === wordsPerMuglyph &&
             !tf.words[-1].lines[-1].parentTextFrames.length ) {
    // frame has the target number of words, but last word hyphenates to overflow text
    // put a frame break before the word instead
    var firstChar = tf.words[-1].characters.firstItem();
    tf.characters.previousItem(firstChar).contents = SpecialCharacters.FRAME_BREAK;
  } else if (tf.words.length >= wordsPerMuglyph) {
    frameBreakAfterN (tf, wordsPerMuglyph);
  }
}

function frameBreakAfterN (tf, n) {
  var lastWord = tf.words[n - 1];
  var lastChar = lastWord.characters.lastItem();
  var nextChar = tf.characters.nextItem(lastChar);
  if(nextChar.isValid) {
    nextChar.contents = SpecialCharacters.FRAME_BREAK;
  }
}

function splitIntoChunks(text, targetSize) {
  var words = text.words.everyItem().getElements();
  var s = text.parentStory[0];
  var chunkCount = Math.ceil(words.length / targetSize);
  var idealChunkSize = words.length / chunkCount;

  var endIx;

  var floatCounter = words.length;
  for (var chunkCounter = chunkCount - 1; chunkCounter >= 0; chunkCounter--) {
    endIx = Math.floor(floatCounter) - 1;

    // find next word
    var nextWord = s.words.nextItem(words[endIx]);

    if(nextWord.isValid) {
      nextWord.insertionPoints.firstItem().contents = SpecialCharacters.FRAME_BREAK;
    }

    floatCounter -= idealChunkSize;
  }

}

function wordFitError(widthType, paraStyle, muTf, prevTf) {
  var longWord;
  if(prevTf) {
    longWord = muTf.parentStory.words.nextItem(prevTf.words.lastItem()).contents;
  } else {
    longWord = muTf.parentStory.words.firstItem().contents;
  }
  var hyphenationOn = muTf.parentStory.hyphenation;

  var errMsg = "The word \"" + longWord + "\" is too long to fit into a text frame. To resolve this issue you could do either of the following and then run the script again:\r\r";

  if(widthType === "fixed") {
    errMsg += "\u2022 Increase the fixed width in the script settings\r";
  } else {
    errMsg += "\u2022 Decrease the count of MuGlyphs per line in the script settings\r"
  }

  if(!hyphenationOn) {
    errMsg += "\u2022 Turn on hyphenation in " + (paraStyle ? "the paragraph style \"" + paraStyle.name + "\"" : "your source text") + "\r";
  }
  errMsg += "\u2022 Decrease the point size in " + (paraStyle ? "the paragraph style \"" + paraStyle.name + "\"" : "your source text") + "\r";
  errMsg += "\u2022 Decrease the horizontal gutter value";

  userError(errMsg, undefined, true);
}

function changeGrep(targetContainer, findGrep, changeGrep) {
  app.findGrepPreferences.findWhat= findGrep;
  app.changeGrepPreferences.changeTo= changeGrep;
  targetContainer.changeGrep();
};

function getMargins(page, muLayer) {

  // check, if there are guides
  var g = page.guides;
  var hg = [];
  var vg = [];
  for (var i = 0; i < g.length; i++) {
    if(g[i].itemLayer === muLayer) {
      if(g[i].orientation === HorizontalOrVertical.HORIZONTAL) {
        hg.push(g[i]);
      } else {
        vg.push(g[i]);
      }
    }
  }

  hg.sort(function(a, b) {return a.location - b.location});
  vg.sort(function(a, b) {return a.location - b.location});

  var pb = page.bounds;
  var mp = page.marginPreferences;
  var leftHand = page.side === PageSideOptions.LEFT_HAND;

  var m = {
    t: hg.length > 1 ? hg[0].location             : mp.top,
    b: hg.length > 1 ? hg[hg.length - 1].location : pb[2] - mp.bottom,
    l: vg.length > 1 ? vg[0].location             : pb[1] + (leftHand ? mp.right : mp.left),
    r: vg.length > 1 ? vg[vg.length - 1].location : pb[3] - (leftHand ? mp.left : mp.right)
  }

  m.w = m.r - m.l;
  m.h = m.b - m.t;

  return m;
};

function userError(msg, errorType, undo) {
  var type = errorType || "Error";
  throw {userError: true, message: type + "\n" + msg, undo: undo};
}


// ---- ui ---- //

function ui(myDoc, tf) {

  var docUnits = getDocUnits(myDoc);
  var paraStyleId;
  var overallIx = 0; // needed to build the para style list

  // ---- extract previously saved settings ---- //
  var savedSettings = eval(app.extractLabel("trych_mutypo_usersettings"));

  // user defaults
  var ud = {};

  if(savedSettings) {
    // if previously saved settings are found, map them back to global (user settings) vars
    for (var prop in savedSettings) {

      // backup user defaults
      ud[prop] = $.global[prop];

      if(prop === "paraStyleName" ||
         prop === "paraStyleId" ||
         prop === "targetLayerName" ||
         prop === "targetLayerId" ||
         prop === "targetPageName") {
        continue;
      }

      $.global[prop] = savedSettings[prop];
    }

    var allParaStyles = myDoc.allParagraphStyles;

    for (var i = 0; i < allParaStyles.length; i++) {
      if(allParaStyles[i].id === savedSettings.paraStyleId &&
         allParaStyles[i].name === savedSettings.paraStyleName) {
        paraStyleId = savedSettings.paraStyleId;
        break;
      }
    }

    if(myDoc.layers.itemByID(savedSettings.targetLayerId).isValid && myDoc.layers.itemByID(savedSettings.targetLayerId).name === savedSettings.targetLayerName) {
      // found layer in the document
      targetLayerName = savedSettings.targetLayerName;
    }

    if(myDoc.pages.item(savedSettings.targetPageName).isValid) {
      // found page in the document
      targetPageName = savedSettings.targetPageName;
    }

  }


  // ---- pre processing values to fill the UI ---- //

  if(!paraStyleId) {
    paraStyleId = myDoc.paragraphStyles.item(paraStyleName).isValid ? myDoc.paragraphStyles.item(paraStyleName).id : 0;
  }

  var multiplePages = myDoc.pages.length > 1;
  var currPage = tf.parentPage || tf.parent.pages.firstItem();
  var currPageName = "( " + currPage.name + " )";

  if(!myDoc.pages.item(targetPageName).isValid) {

    if(multiplePages) {
      // if possible get next page, else previous page
      var offset = currPage.documentOffset + 1 === myDoc.pages.length ? -1 : 1;
      targetPageName = myDoc.pages[currPage.documentOffset + offset].name;
    } else {
      targetPageName = currPage.name;
    }
  }

  var layerNames = ["[Create New]", "-"].concat(myDoc.layers.everyItem().name);
  var layerIx = 0;

  targetLayerName = myDoc.layers.item(targetLayerName).isValid ? targetLayerName : "mutypo";

  for (var i = 2; i < layerNames.length; i++) {
    if(layerNames[i].toLowerCase() === targetLayerName.toLowerCase()) {
      layerIx = i;
      break;
    }
  }


  // ---- UI ---- //

  // DIALOG
  // ======
  var dialog = new Window("dialog");
      dialog.text = "MuTypo v" + versionNo;
      dialog.orientation = "row";
      dialog.alignChildren = ["left","top"];
      dialog.spacing = 10;
      dialog.margins = 16;

  // G
  // =
  var g = dialog.add("group", undefined, {name: "g"});
      g.orientation = "column";
      g.alignChildren = ["fill","top"];
      g.spacing = 10;
      g.margins = 0;

  // MUGLYPHPANEL
  // ============
  var muglyphPanel = g.add("panel", undefined, undefined, {name: "muglyphPanel"});
      muglyphPanel.text = "MuGlyphs";
      muglyphPanel.preferredSize.height = 230;
      muglyphPanel.orientation = "column";
      muglyphPanel.alignChildren = ["fill","top"];
      muglyphPanel.spacing = 10;
      muglyphPanel.margins = 14;

  // MUFORMATGROUP
  // =============
  var muformatGroup = muglyphPanel.add("group", undefined, {name: "muformatGroup"});
      muformatGroup.orientation = "row";
      muformatGroup.alignChildren = ["left","center"];
      muformatGroup.spacing = 10;
      muformatGroup.margins = 0;

  var statictext1 = muformatGroup.add("statictext", undefined, "MuFormat:", {name: "statictext1"});
      statictext1.helpTip = "Max number of lines in a MuGlyph.";

  var muformat_array = ["1","2","3","4","5"];
  var muformat = muformatGroup.add("dropdownlist", undefined, undefined, {name: "muformat", items: muformat_array});
      muformat.helpTip = "Max number of lines in a MuGlyph.";
      muformat.selection = muFormat > 0 && muFormat < 6 ? muFormat - 1 : 2;
      muformat.preferredSize.width = 93;
      muformat.onChange = function(){reset.enabled = true;}

  // WORDSPERMUGLYPHGROUP
  // ====================
  var wordsPerMuglyphGroup = muglyphPanel.add("group", undefined, {name: "wordsPerMuglyphGroup"});
      wordsPerMuglyphGroup.orientation = "row";
      wordsPerMuglyphGroup.alignChildren = ["left","center"];
      wordsPerMuglyphGroup.spacing = 10;
      wordsPerMuglyphGroup.margins = 0;

  var statictext2 = wordsPerMuglyphGroup.add("statictext", undefined, "Target Word Count:", {name: "statictext2"});
      statictext2.helpTip = "Target number of words to be placed into a MuGlyph.\nSet to 0 to place as many words as fit.";

  var wordspermuglyph = wordsPerMuglyphGroup.add('edittext {size: [40,23], justify: "center", properties: {name: "wordspermuglyph"}}');
      wordspermuglyph.helpTip = "Target number of words to be placed into a MuGlyph.\nSet to 0 to place as many words as fit.";
      wordspermuglyph.text = wordsPerMuglyph;

      wordspermuglyph.onChange = function() {
        if(this.text === "0") {
          if(radiobutton3.value) {
            radiobutton1.value = true;
            edittext1.enabled = true;
            radiobutton2.value = false;
            edittext2.enabled = false;
            radiobutton3.value = false;
          }
          fluidGroup.enabled = false;
        } else {
          fluidGroup.enabled = true;
        };
        reset.enabled = true;
      };

  // WIDTHTYPEPANEL
  // ==============
  var widthTypePanel = muglyphPanel.add("panel", undefined, undefined, {name: "widthTypePanel"});
      widthTypePanel.text = "Width Type";
      widthTypePanel.orientation = "column";
      widthTypePanel.alignChildren = ["left","top"];
      widthTypePanel.spacing = 10;
      widthTypePanel.margins = 14;

  // FIXEDGROUP
  // ==========
  var fixedGroup = widthTypePanel.add("group", undefined, {name: "fixedGroup"});
      fixedGroup.orientation = "row";
      fixedGroup.alignChildren = ["left","center"];
      fixedGroup.spacing = 15;
      fixedGroup.margins = 0;

  var radiobutton1 = fixedGroup.add("radiobutton", undefined, undefined, {name: "radiobutton1"});
      radiobutton1.helpTip = "Sets a fixed width for each MuGlyph.";
      radiobutton1.text = "Fixed";
      radiobutton1.value = widthType === "fixed";

      radiobutton1.onClick = function() {
        println("onClick radiobutton1");
        edittext1.enabled = true;
        radiobutton2.value = false;
        edittext2.enabled = false;
        radiobutton3.value = false;
        reset.enabled = true;
      };

  var edittext1 = fixedGroup.add('edittext {size: [80,23], justify: "center", properties: {name: "edittext1"}}');
      edittext1.helpTip = "Sets a fixed width for each MuGlyph.";
      edittext1.text = convertUnits(fixedWidth, docUnits, true);
      edittext1.enabled = widthType === "fixed";

      edittext1.onChange = function() {
        edittext1.text = convertUnits(edittext1.text.toLowerCase(), docUnits);
      }

  // COUNTGROUP
  // ==========
  var countGroup = widthTypePanel.add("group", undefined, {name: "countGroup"});
      countGroup.orientation = "row";
      countGroup.alignChildren = ["left","center"];
      countGroup.spacing = 11;
      countGroup.margins = [0,0,0,3];

  var radiobutton2 = countGroup.add("radiobutton", undefined, undefined, {name: "radiobutton2"});
      radiobutton2.helpTip = "Places the given number of MuGlyphs in each line.";
      radiobutton2.text = "Count";
      radiobutton2.value = widthType === "count";

      radiobutton2.onClick = function() {
        radiobutton1.value = false;
        edittext1.enabled = false;
        edittext2.enabled = true;
        radiobutton3.value = false;
        reset.enabled = true;
      };

  var edittext2 = countGroup.add('edittext {size: [80,23], justify: "center", properties: {name: "edittext2"}}');
      edittext2.enabled = false;
      edittext2.helpTip = "Places the given number of MuGlyphs in each line.";
      edittext2.text = wordsPerMuglyph;
      edittext2.enabled = widthType === "count";

  // FLUIDGROUP
  // ==========
  var fluidGroup = widthTypePanel.add("group", undefined, {name: "fluidGroup"});
      fluidGroup.orientation = "row";
      fluidGroup.alignChildren = ["left","center"];
      fluidGroup.spacing = 10;
      fluidGroup.margins = 0;

  var radiobutton3 = fluidGroup.add("radiobutton", undefined, undefined, {name: "radiobutton3"});
      radiobutton3.helpTip = "Makes the width of each MuGlyph dependent on the words within.\nCannot be used if Target Word Count is set to 0.";
      radiobutton3.text = "Fluid";
      radiobutton3.value = widthType === "fluid";

      radiobutton3.onClick = function() {
        if(fluidGroup.enabled) {
          radiobutton1.value = false;
          edittext1.enabled = false;
          radiobutton2.value = false;
          edittext2.enabled = false;
          reset.enabled = true;
        }
      };

  // GUTTERPANEL
  // ===========
  var gutterPanel = g.add("panel", undefined, undefined, {name: "gutterPanel"});
      gutterPanel.text = "Gutter";
      gutterPanel.preferredSize.width = 233;
      gutterPanel.preferredSize.height = 128;
      gutterPanel.orientation = "column";
      gutterPanel.alignChildren = ["left","top"];
      gutterPanel.spacing = 10;
      gutterPanel.margins = 14;

  // GROUP1
  // ======
  var group1 = gutterPanel.add("group", undefined, {name: "group1"});
      group1.orientation = "column";
      group1.alignChildren = ["right","center"];
      group1.spacing = 10;
      group1.margins = 0;

  // HORGUTTERGROUP
  // ==============
  var horGutterGroup = group1.add("group", undefined, {name: "horGutterGroup"});
      horGutterGroup.orientation = "row";
      horGutterGroup.alignChildren = ["left","center"];
      horGutterGroup.spacing = 10;
      horGutterGroup.margins = 0;

  var statictext3 = horGutterGroup.add("statictext", undefined, "Horizontal:", {name: "statictext3"});
      statictext3.helpTip = "Width of the horizontal gutter between single MuGlyphs.";

  var edittext3 = horGutterGroup.add('edittext {size: [80,23], justify: "center", properties: {name: "edittext3"}}');
      edittext3.helpTip = "Width of the horizontal gutter between single MuGlyphs.";
      edittext3.text = convertUnits(horGutter, docUnits, true);

      edittext3.onChange = function() {
        edittext3.text = convertUnits(edittext3.text.toLowerCase(), docUnits);
        reset.enabled = true;
      }

  // VERGUTTERGROUP
  // ==============
  var verGutterGroup = group1.add("group", undefined, {name: "verGutterGroup"});
      verGutterGroup.orientation = "row";
      verGutterGroup.alignChildren = ["left","center"];
      verGutterGroup.spacing = 10;
      verGutterGroup.margins = [0,0,0,3];

  var statictext4 = verGutterGroup.add("statictext", undefined, "Vertical:", {name: "statictext4"});
      statictext4.helpTip = "Height of the vertical gutter between lines of MuGlyphs.";

  var edittext4 = verGutterGroup.add('edittext {size: [80,23], justify: "center", properties: {name: "edittext4"}}');
      edittext4.helpTip = "Height of the vertical gutter between lines of MuGlyphs.";
      edittext4.text = convertUnits(vertGutter, docUnits, true);

      edittext4.onChange = function() {
        edittext4.text = convertUnits(edittext4.text.toLowerCase(), docUnits);
        reset.enabled = true;
      }

  // GUTTERPANEL
  // ===========
  var checkbox1 = gutterPanel.add("checkbox", undefined, undefined, {name: "checkbox1"});
      checkbox1.helpTip = "If selected, the given value for the vertical gutter is increased in a way toh have the last line of MuGlyphs exactly matching the bottom of the page.";
      checkbox1.text = "Auto-Fit Vertical Gutter";
      checkbox1.value = fitVerticalGutter;

      checkbox1.onClick = function(){reset.enabled = true;}

  // PARASTYLEPANEL
  // ==============
  var paraStylePanel = g.add("panel", undefined, undefined, {name: "paraStylePanel"});
      paraStylePanel.text = "Paragraph Style";
      paraStylePanel.preferredSize.height = 90;
      paraStylePanel.orientation = "column";
      paraStylePanel.alignChildren = ["left","top"];
      paraStylePanel.spacing = 10;
      paraStylePanel.margins = 14;

  var checkbox2 = paraStylePanel.add("checkbox", undefined, undefined, {name: "checkbox2"});
      checkbox2.helpTip = "Apply a paragraph style to the text of the resulting MuGlyphs.";
      checkbox2.text = "Apply Paragraph Style";
      checkbox2.value = applyParaStyle;

      checkbox2.onClick = function () {
        dropdown1.enabled = checkbox2.value;
        reset.enabled = true;
      };

  var dropdown1 = paraStylePanel.add("dropdownlist");
      var selectId = buildList(myDoc, dropdown1, ' ');
      dropdown1.remove(dropdown1.items[0]);
      dropdown1.enabled = applyParaStyle;
      dropdown1.helpTip = "Apply a paragraph style to the text of the resulting MuGlyphs.";
      dropdown1.selection = selectId ? selectId - 1 : 0;
      dropdown1.alignment = ["fill","top"];

      dropdown1.onChange = function(){reset.enabled = true};

  // GROUP2
  // ======
  var group2 = dialog.add("group", undefined, {name: "group2"});
      group2.orientation = "column";
      group2.alignChildren = ["left","center"];
      group2.spacing = 10;
      group2.margins = 0;

  // PLACEMENTPANEL
  // ==============
  var placementPanel = group2.add("panel", undefined, undefined, {name: "placementPanel"});
      placementPanel.text = "Placement";
      placementPanel.preferredSize.width = 240;
      placementPanel.preferredSize.height = 230;
      placementPanel.orientation = "column";
      placementPanel.alignChildren = ["fill","top"];
      placementPanel.spacing = 10;
      placementPanel.margins = 14;

  // STARTPAGEPANEL
  // ==============
  var startPagePanel = placementPanel.add("panel", undefined, undefined, {name: "startPagePanel"});
      startPagePanel.enabled = multiplePages;
      startPagePanel.text = "Start Page";
      startPagePanel.orientation = "column";
      startPagePanel.alignChildren = ["left","top"];
      startPagePanel.spacing = 10;
      startPagePanel.margins = 14;

  // CURRENTGROUP
  // ============
  var currentGroup = startPagePanel.add("group", undefined, {name: "currentGroup"});
      currentGroup.orientation = "row";
      currentGroup.alignChildren = ["left","center"];
      currentGroup.spacing = 10;
      currentGroup.margins = 0;

  var radiobutton4 = currentGroup.add("radiobutton", undefined, undefined, {name: "radiobutton4"});
      radiobutton4.helpTip = "Start placing the MuTypography on the current page.";
      radiobutton4.text = "Current";
      radiobutton4.value = targetPageCurrent;

      radiobutton4.onClick = function() {
        radiobutton5.value = false;
        edittext5.enabled = false;
        ok.enabled = true;
        reset.enabled = true;
      };

  var statictext5 = currentGroup.add("statictext", undefined, currPageName, {name: "statictext5"});
      statictext5.helpTip = "Start placing the MuTypography on the current page.";

  // PAGEGROUP
  // =========
  var pageGroup = startPagePanel.add("group", undefined, {name: "pageGroup"});
      pageGroup.orientation = "row";
      pageGroup.alignChildren = ["left","center"];
      pageGroup.spacing = 10;
      pageGroup.margins = 0;

  var radiobutton5 = pageGroup.add("radiobutton", undefined, undefined, {name: "radiobutton5"});
      radiobutton5.helpTip = "Sets the starting page to the given page.";
      radiobutton5.text = "Page";
      radiobutton5.value = !targetPageCurrent;

      radiobutton5.onClick = function() {
        radiobutton4.value = false;
        edittext5.enabled = true;
        if(!myDoc.pages.item(edittext5.text).isValid) {
          ok.enabled = false;
        }
        reset.enabled = true;
      };

  var edittext5 = pageGroup.add('edittext {size: [80,23], justify: "center", properties: {name: "edittext5"}}');
      edittext5.enabled = !targetPageCurrent;
      edittext5.helpTip = "Sets the starting page to the given page.";
      edittext5.text = targetPageName;

      edittext5.onChanging = function() {
        var valid = edittext5.text === "" || myDoc.pages.item(edittext5.text).isValid;
        this.graphics.backgroundColor = this.graphics.newBrush(this.graphics.BrushType.SOLID_COLOR, valid ? [1, 1, 1, 1] : [1, 0.5, 0.5, 1]);
        ok.enabled = valid && !(edittext5.text === "");
        reset.enabled = true;
      }

  // PANEL1
  // ======
  var panel1 = placementPanel.add("panel", undefined, undefined, {name: "panel1"});
      panel1.text = "Layer";
      panel1.orientation = "column";
      panel1.alignChildren = ["left","top"];
      panel1.spacing = 10;
      panel1.margins = 14;

  var dropdown2_array = layerNames;
  var dropdown2 = panel1.add("dropdownlist", undefined, undefined, {name: "dropdown2", items: dropdown2_array});
      dropdown2.helpTip = "Target layer for the MuTypography layout.";
      dropdown2.selection = layerIx;
      dropdown2.preferredSize.width = 154;
      dropdown2.alignment = ["fill","top"];

      dropdown2.onChange = function(){reset.enabled = true;}

  // UNDERLINESPANEL
  // ===============
  var underlinesPanel = group2.add("panel", undefined, undefined, {name: "underlinesPanel"});
      underlinesPanel.text = "Underlines";
      underlinesPanel.preferredSize.width = 240;
      underlinesPanel.preferredSize.height = 128;
      underlinesPanel.orientation = "column";
      underlinesPanel.alignChildren = ["left","top"];
      underlinesPanel.spacing = 10;
      underlinesPanel.margins = 14;

  var checkbox3 = underlinesPanel.add("checkbox", undefined, undefined, {name: "checkbox3"});
      checkbox3.helpTip = "Draw underlines between lines of MuGlyphs.";
      checkbox3.text = "Draw Underlines";
      checkbox3.value = underline;

      checkbox3.onClick = function () {
        group3.enabled = checkbox3.value;
        reset.enabled = true;
      };


  // GROUP3
  // ======
  var group3 = underlinesPanel.add("group", undefined, {name: "group3"});
      group3.enabled = underline;
      group3.orientation = "column";
      group3.alignChildren = ["right","center"];
      group3.spacing = 10;
      group3.margins = 0;

  // UNDERLINEWEIGHTGROUP
  // ====================
  var underlineWeightGroup = group3.add("group", undefined, {name: "underlineWeightGroup"});
      underlineWeightGroup.orientation = "row";
      underlineWeightGroup.alignChildren = ["left","center"];
      underlineWeightGroup.spacing = 10;
      underlineWeightGroup.margins = [0,0,0,3];

  var statictext6 = underlineWeightGroup.add("statictext", undefined, "Underline Weight:", {name: "statictext6"});
      statictext6.helpTip = "Width of the underline stroke.";

  var edittext6 = underlineWeightGroup.add('edittext {size: [80,23], justify: "center", properties: {name: "edittext6"}}');
      edittext6.helpTip = "Width of the underline stroke.";
      edittext6.text = convertUnits(underlineWeight, "pt", true);

      edittext6.onChange = function() {
        edittext6.text = convertUnits(edittext6.text.toLowerCase(), "pt");
      }

  // UNDERLINEOFFSETGROUP
  // ====================
  var underlineOffsetGroup = group3.add("group", undefined, {name: "underlineOffsetGroup"});
      underlineOffsetGroup.orientation = "row";
      underlineOffsetGroup.alignChildren = ["left","center"];
      underlineOffsetGroup.spacing = 10;
      underlineOffsetGroup.margins = [0,0,0,3];

  var statictext7 = underlineOffsetGroup.add("statictext", undefined, "Underline Offset:", {name: "statictext7"});
      statictext7.helpTip = "Vertical offset of the underline.\nPositive values move the line up, negative ones move the line down.";

  var edittext7 = underlineOffsetGroup.add('edittext {size: [80,23], justify: "center", properties: {name: "edittext7"}}');
      edittext7.helpTip = "Vertical offset of the underline.\nPositive values move the line up, negative ones move the line down.";
      edittext7.text = convertUnits(underlineOffset, docUnits, true);

      edittext7.onChange = function() {
        edittext7.text = convertUnits(edittext7.text.toLowerCase(), docUnits);
      }

  // OPTIONSPANEL
  // =============
  var optionsPanel = group2.add("panel", undefined, undefined, {name: "optionsPanel"});
      optionsPanel.text = "Options";
      optionsPanel.preferredSize.width = 240;
      optionsPanel.preferredSize.height = 90;
      optionsPanel.orientation = "column";
      optionsPanel.alignChildren = ["fill","top"];
      optionsPanel.spacing = 10;
      optionsPanel.margins = 14;

  var checkbox4 = optionsPanel.add("checkbox", undefined, undefined, {name: "checkbox4"});
      checkbox4.helpTip = "Automatically adds new pages if the end of the document is reached during MuGlyph creation.";
      checkbox4.text = "Automatically Add Pages";
      checkbox4.value = autoAddPages;
      checkbox4.onClick = function(){reset.enabled = true;}

  var checkbox5 = optionsPanel.add("checkbox", undefined, undefined, {name: "checkbox5"});
      checkbox5.helpTip = "Deletes the source text frame after the MuGylph creation.";
      checkbox5.text = "Delete Source Text Frame";
      checkbox5.value = deleteSourceFrame;
      checkbox5.onClick = function(){reset.enabled = true;}

  // BUTTONSGROUP
  // ============
  var buttonsGroup = dialog.add("group", undefined, {name: "buttonsGroup"});
      buttonsGroup.orientation = "column";
      buttonsGroup.alignChildren = ["fill","top"];
      buttonsGroup.spacing = 10;
      buttonsGroup.margins = 2;
      buttonsGroup.alignment = ["left","top"];

  // OKCANCELGROUP
  // =============
  var okCancelGroup = buttonsGroup.add("group", undefined, {name: "okCancelGroup"});
      okCancelGroup.orientation = "column";
      okCancelGroup.alignChildren = ["fill","center"];
      okCancelGroup.spacing = 10;
      okCancelGroup.margins = [0,0,0,30];

  var ok = okCancelGroup.add("button", undefined, undefined, {name: "ok"});
      ok.text = "Create MuTypo";

  var cancel = okCancelGroup.add("button", undefined, undefined, {name: "cancel"});
      cancel.text = "Cancel";

  var checkbox6 = okCancelGroup.add("checkbox", undefined, undefined, {name: "checkbox6"});
      checkbox6.helpTip = "Remember the selected settings for next time.";
      checkbox6.text = "Remember Settings";
      checkbox6.value = rememberSettings;

  // BUTTONSGROUP
  // ============
  var reset = buttonsGroup.add("button", undefined, undefined, {name: "reset"});
      reset.enabled = true;
      reset.helpTip = "Resets all values to the default settings.";
      reset.text = "Reset to Default";
      reset.alignment = ["fill","top"];

      reset.onClick = function() {
        muformat.selection = ud.muFormat > 0 && ud.muFormat < 6 ? ud.muFormat - 1 : 2;
        wordspermuglyph.text = ud.wordsPerMuglyph;

        radiobutton1.value = ud.widthType === "fixed";
        edittext1.enabled = ud.widthType === "fixed";
        edittext1.text = convertUnits(ud.fixedWidth, docUnits, true);

        radiobutton2.value = ud.widthType === "count";
        edittext2.enabled = ud.widthType === "count";
        edittext2.text = ud.muglyphsPerLine;

        radiobutton3.value = ud.widthType === "fluid";

        edittext3.text = convertUnits(ud.horGutter, docUnits, true);
        edittext4.text = convertUnits(ud.vertGutter, docUnits, true);
        checkbox1.value = ud.fitVerticalGutter;

        checkbox2.value = ud.applyParaStyle;
        dropdown1.enabled = ud.applyParaStyle;
        dropdown1.selection = 0;

        radiobutton4.value = ud.targetPageCurrent;
        radiobutton5.value = !ud.targetPageCurrent;
        edittext5.enabled = !ud.targetPageCurrent;
        edittext5.text = ud.targetPageName;

        dropdown2.selection = layerIx;

        checkbox3.value = ud.underline;
        group3.enabled = ud.underline;
        edittext6.text = convertUnits(ud.underlineWeight, "pt", true);
        edittext7.text = convertUnits(ud.underlineOffset, docUnits, true);

        checkbox4.value = ud.autoAddPages;
        checkbox5.value = ud.deleteSourceFrame;

        reset.enabled = false;
        ok.enabled = true;

        app.insertLabel("trych_mutypo_usersettings", "");
      }

  var createOrCancel = dialog.show();

  if(createOrCancel === 2) {
    // script cancelled by user
    return false;
  }

  var userChoice = {
    muFormat: muformat.selection + 1,
    wordsPerMuglyph: wordspermuglyph.text,

    widthType: radiobutton1.value ? "fixed" : (radiobutton2.value ? "count" : "fluid"),
    fixedWidth: edittext1.text,
    muglyphsPerLine: edittext2.text,

    horGutter: edittext3.text,
    vertGutter: edittext4.text,
    fitVerticalGutter: checkbox1.value,

    applyParaStyle: checkbox2.value,
    paraStyleId: dropdown1.selection.id,
    paraStyleName: dropdown1.selection.name,

    targetPageCurrent: radiobutton4.value,
    targetPageName: edittext5.text,
    targetLayerId: dropdown2.selection < 2 ? 0 : myDoc.layers.item(dropdown2.selection.text).id,
    targetLayerName: dropdown2.selection < 2 ? "" : dropdown2.selection.text,

    underline: checkbox3.value,
    underlineWeight: edittext6.text,
    underlineOffset: edittext7.text,

    autoAddPages: checkbox4.value,
    deleteSourceFrame: checkbox5.value
  };

  if(checkbox6.value) {
    // remember settings for next time
    app.insertLabel("trych_mutypo_usersettings", userChoice.toSource());
  } else {
    // delete all saved settings for next time
    app.insertLabel("trych_mutypo_usersettings", "");
  }

  return userChoice;


  // ---- ui helper functions ---- //

  function buildList(scope, list, str, selectId) {

    var styles = scope.paragraphStyles.everyItem().getElements();
    for (var i = 0; i < styles.length; i++) {
      var temp = list.add('item', styles[i].name + (str === ' ' ? ' ' : ' (' + str + ')'));
      temp.id = styles[i].id; // Add property so we can easily get a handle on the style later
      temp.name = styles[i].name;

      if(styles[i].id === paraStyleId) {
        selectId = overallIx;
      }
      overallIx++;

    }

    for (var j = 0; j < scope.paragraphStyleGroups.length; j++) {
      selectId = buildList(scope.paragraphStyleGroups[j], list, scope.paragraphStyleGroups[j].name + (str === ' ' ? '' : ':')  + (str == ' ' ? '' : str), selectId);
    }

    return selectId;
  }

  function convertUnits(n, to, rounding) {
    var unitConversions = {
      'pt': 1.0000000000,
      'p': 12.0000000000,
      'mm': 2.8346456692,
      'in': 72.00000000,
      'ag': 5.1428571428,
      'cm': 28.3464566929,
      'c': 12.7878751998,
      'tr': 3.0112500000 // traditional point -- but we don't do anything with it yet
    }
    var obj = fixMeasurement(n);
    var temp = (obj.amount * unitConversions[obj.unit]) / unitConversions[to];
    return outputFormat(temp, to, rounding);
  }

  // Add the target unit to the amount, either suffixed pt, ag, mm, cm, in, or infixed p or c
  function outputFormat(amount, target, rounding) {
    amount = amount.toFixed(3).replace(/\.?0+$/, '');
    if (target.length === 2) {
      // two-character unit: pt, mm, etc.
      return String(rounding ? Math.round(amount) : amount) + ' ' + target;
    } else {
      // 'p' or 'c'
      // calculate the decimal
      var decimal = (Number(amount) - parseInt(amount)) * 12;
      // return the integer part of the result + infix + formatted decimal
      return parseInt(amount) + target + decimal;
    }
  }

  function fixMeasurement(n) {
    n = n.replace(/ /g,'');
    // infixed 'p' and 'c' to decimal suffixes: 3p6 > 3.5 p
    n = n.replace(/(\d+)([pc])([.\d]+)$/, function () {
      return Number(arguments[1]) + Number(arguments[3] / 12) + arguments[2];
    });
    // split on unit
    var temp = n.split(/(ag|cm|mm|c|pt|p|in)$/);
    return {
      amount: Number (temp[0]),
      unit: temp.length === 1 ? docUnits : temp[1]
    };
  }

  function getDocUnits(docdocument) {
    switch (document.viewPreferences.horizontalMeasurementUnits) {
      case 2053991795: return 'mm';
      case 2053336435: return 'cm';
      case 2053729891: return 'in';
      case 2053729892: return 'in';
      case 2054188905: return 'pt';
      case 2054187363: return 'p';
      case 2051106676: return 'ag';
      case 2053335395: return 'c';
    }
  }

}
