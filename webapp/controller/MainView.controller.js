sap.ui.define([
  "sap/m/MessageToast",
  "sap/ui/core/mvc/Controller"
], function (MessageToast, Controller) {
  "use strict";

  return Controller.extend("documentinfoextractor.controller.MainView", {
    onInit: function () {
      // Initialization logic can go here if needed
    },

    // File Uploader Handlers
    handleUploadComplete: function (oEvent) {
      var sResponse = oEvent.getParameter("response"),
        iHttpStatusCode = parseInt(/\d{3}/.exec(sResponse)[0], 10),
        sMessage;

      if (sResponse) {
        sMessage =
          iHttpStatusCode === 200
            ? sResponse + " (Upload Success)"
            : sResponse + " (Upload Error)";
        MessageToast.show(sMessage);
      }
    },

    handleUploadPress: function () {
      var oFileUploader = this.byId("fileUploader");
      if (!oFileUploader.getValue()) {
        MessageToast.show("Choose a file first");
        return;
      }
      oFileUploader
        .checkFileReadable()
        .then(
          function () {
            oFileUploader.upload();
          },
          function () {
            MessageToast.show(
              "The file cannot be read. It may have changed."
            );
          }
        )
        .then(function () {
          oFileUploader.clear();
        });
    },

    handleTypeMissmatch: function (oEvent) {
      var aFileTypes = oEvent.getSource().getFileType();
      aFileTypes = aFileTypes.map(function (sType) {
        return "*." + sType;
      });
      MessageToast.show(
        "The file type *." +
          oEvent.getParameter("fileType") +
          " is not supported. Choose one of the following types: " +
          aFileTypes.join(", ")
      );
    },

    handleValueChange: function (oEvent) {
      var oFile = oEvent.getParameter("files")[0];

      if (oFile) {
        var oReader = new FileReader();
        oReader.onload = function (e) {
          // Set the preview image source and make it visible
          var oImage = this.byId("filePreview");
          oImage.setSrc(e.target.result);
          oImage.setVisible(true);

          // Show the "File Preview" label
          this.byId("previewText").setVisible(true);
        }.bind(this);

        oReader.readAsDataURL(oFile);
        MessageToast.show("File selected: " + oFile.name);
      } else {
        MessageToast.show("No file selected.");
      }
    }
  });
});
