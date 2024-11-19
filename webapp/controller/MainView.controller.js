sap.ui.define([
  "sap/m/MessageToast",
  "sap/ui/core/mvc/Controller"
], function (MessageToast, Controller) {
  "use strict";

  return Controller.extend("documentinfoextractor.controller.MainView", {

    onInit: function () {
      // Initialization logic, if needed, can be added here
    },

    /**
     * Handles the completion of file upload.
     * Displays a success or error message based on the HTTP status code.
     */
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

    /**
     * Handles the file upload button press.
     * Ensures a file is selected and attempts to upload it.
     */
    handleUploadPress: function () {
      var oFileUploader = this.byId("fileUploaderMain"); // Adjusted ID
      if (!oFileUploader.getValue()) {
        MessageToast.show("Please choose a file before uploading.");
        return;
      }

      oFileUploader
        .checkFileReadable()
        .then(
          function () {
            oFileUploader.upload();
          },
          function () {
            MessageToast.show("The file cannot be read. It may have changed.");
          }
        )
        .finally(function () {
          oFileUploader.clear();
        });
    },

    /**
     * Handles file type mismatch errors.
     * Displays supported file types to the user.
     */
    handleTypeMissmatch: function (oEvent) {
      var aFileTypes = oEvent.getSource().getFileType();
      aFileTypes = aFileTypes.map(function (sType) {
        return "*." + sType;
      });
      MessageToast.show(
        "The file type *." +
          oEvent.getParameter("fileType") +
          " is not supported. Supported types are: " +
          aFileTypes.join(", ")
      );
    },

    /**
     * Handles changes in file input.
     * Previews the selected file and shows a toast message.
     */
    handleValueChange: function (oEvent) {
      var oFile = oEvent.getParameter("files")[0];

      if (oFile) {
        var oReader = new FileReader();

        oReader.onload = function (e) {
          // Set the preview image source and make it visible
          var oImage = this.byId("filePreview");
          oImage.setSrc(e.target.result);
          oImage.setVisible(true);

          // Show the "File Preview" text
          this.byId("previewText").setVisible(true);

          // Make the Proceed button visible
          this.byId("proceedButton").setVisible(true);
        }.bind(this);

        // Read the file as a data URL for preview
        oReader.readAsDataURL(oFile);
        MessageToast.show("File selected: " + oFile.name);
      } else {
        MessageToast.show("No file selected.");
      }
    },

    /**
     * Handles the Proceed button press.
     * Can be customized with further logic.
     */
    onProceedPress: function () {
      MessageToast.show("Proceeding with the selected file.");
      // Add custom logic here for proceeding with the file
    }
  });
});
