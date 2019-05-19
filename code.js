function bqSchema(range) {
    "use strict";
    var schema = [];

    function addToSchema(schemaRow, s) {
        var keys = schemaRow.name.split(".");

        if (keys.length === 1) {
            s.push(schemaRow);
            return;
        }

        var repeatedRows = s.filter(function (row) {
            return row.name === keys[0];
        });

        keys.shift();
        schemaRow.name = keys.join(".");
        return addToSchema(schemaRow, repeatedRows[0].fields);
    }

    range.forEach(function (row) {
        // ignore if the name is empty
        if(!row[0]) {
           return;
        }
        var schemaRow = {};
        schemaRow.name = row[0];
        schemaRow.type = row[1];
        schemaRow.mode = row[2];
        schemaRow.description = row[3];
        if (schemaRow.type === "RECORD") {
            schemaRow.fields = [];
        }
        addToSchema(schemaRow, schema);
    });

    return (JSON.stringify(schema));
}

// create the BigQuery table
function createTable() {
    "use strict";
    var dataRangeValues = SpreadsheetApp.getActiveSheet().getDataRange().getValues();
    var projectId = dataRangeValues[0][1];
    var datasetId = dataRangeValues[1][1];
    var tableId = dataRangeValues[2][1];
    var tableName = dataRangeValues[1][3];
    var tableDescription = dataRangeValues[3][1];
    var tableFields = dataRangeValues[0][3];

    var table = BigQuery.newTable()
        .setDescription(tableDescription)
        .setId(tableId)
        .setFriendlyName(tableName)
        
        .setTableReference(
            BigQuery.newTableReference()
            .setDatasetId(datasetId)
            .setProjectId(projectId)
            .setTableId(tableId)
        )
        .setSchema(
            BigQuery.newTableSchema().setFields(JSON.parse(tableFields))
        );

    try {
        BigQuery.Tables.insert(table, projectId, datasetId)
        SpreadsheetApp.getActiveSpreadsheet().toast("Table Created", "Status", 3);
      
    } catch(err) {
      SpreadsheetApp.getActiveSpreadsheet().toast("Error creating table:" + err.message  , "Status", 300);
    }
}

// create the menu
function onOpen() {
    "use strict";
    var ui = SpreadsheetApp.getUi();
    ui.createMenu("BigQuery Menu")
        .addItem("Create Table", "createTable")
        .addToUi();
}
