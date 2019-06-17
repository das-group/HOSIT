/**
 * Class which includes example evaluators which can be used with
 * {@link SearchQueries.getQuery}
 */
class SearchQueryEvaluators {
  /**
   * Evaluation function for a normal RSS feed: Takes the item -> title object
   * of the feed and returns it in lowercase
   *
   * @param  {Item} item Single item of parsed feed
   * @return {String}      Lowercase string of item title
   */
  static evaluateNormal(item) {
    return item.title.toLowerCase();
  }


  /**
   * Evaluation function for the use case of Spiegel Online headlines
   *
   * @param  {Item} item Single item of parsed feed
   * @return {String}    Generated search query out of the single item
   */
  static evaluateSPON(item) {
    // Hole nur das Ende der URL
    var urlSplit = item.link.split("/");
    var url = urlSplit[urlSplit.length - 1];
    // Füge Umlaute hinzu, damit übereinstimmend
    // mit Titel
    url = url.replace("ue", "ü");
    url = url.replace("ae", "ä");
    url = url.replace("oe", "ö");

    // Hole Headline
    var title = item.title;

    var words = url.split("-");
    // Hole ersten drei Wörter
    var query = "";
    var addCount = 0; // Anzahl der zu String hinzugefügten Wörter
    for (var i = 0; i < words.length; i++) {
      // Überspringe Wort, wenn bereits im Query vorhanden
      if (query.search(words[i]) > -1)
        continue;

      // Suche für jedes Wort die entsprechende Anfangsposition im Titel
      var pos = title.toLowerCase().search(words[i]);

      if (pos > -1) { // Wenn Position gefunden
        // Hole Anfangsbuchstaben aus Titel

        var charTitle = title.charAt(pos);
        // Ist der Anfangsbuchstabe der gleiche,
        // muss er klein geschrieben sein => kein Nomen
        if (charTitle !== words[i].charAt(0) && words[i].length > 1 ||
          i < 2 && words[i].length > 2) { // Nehme immer die ersten zwei Wörter,
          // da die in der Regel wichtig sind
          if (addCount >= 4) // Nur vier Wörter maximal hinzufügen
            break;
          // Generiere aus Nomen die Query
          if (query.length > 0)
            query += " ";
          query += words[i];
          addCount++;
        }
      }
    }

    // Füge Query hinzu, wenn Inhalt vorhanden
    if (query.length > 0)
      return query;
    else {
      return "";
    }
  }
}

module.exports = SearchQueryEvaluators;