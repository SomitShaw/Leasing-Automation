sap.ui.define([
  "sap/m/MessageToast",
  "sap/ui/core/mvc/Controller",
  "sap/ui/core/BusyIndicator"
], function (MessageToast, Controller, BusyIndicator) {
  "use strict";

  return Controller.extend("documentinfoextractor.controller.MainView", {
    onInit: function () {
      var oModel = new sap.ui.model.json.JSONModel({
        contractType: "",
        effectiveDate: "",
        expiryDate: ""
      });
      this.getView().setModel(oModel, "view");
    },

    handleUploadComplete: function (oEvent) {
      var sResponse = oEvent.getParameter("response");
      if (sResponse) {
        var iHttpStatusCode = parseInt(/\d{3}/.exec(sResponse)[0], 10);
        var sMessage =
          iHttpStatusCode === 200
            ? sResponse + " (Upload Success)"
            : sResponse + " (Upload Error)";
        MessageToast.show(sMessage);
      }
    },

    handleUploadPress: function () {
      var oFileUploader = this.byId("fileUploaderMain");
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

    handleValueChange: function (oEvent) {
      var oFile = oEvent.getParameter("files")[0];

      if (oFile) {
        var sFileType = oFile.type;

        // Reset the preview elements
        this.byId("filePreview").setVisible(false).setSrc("");
        this.byId("pdfViewer").setVisible(false).setContent("");

        if (sFileType === "application/pdf") {
          var oReader = new FileReader();
          oReader.onload = function (e) {
            var oPdfViewer = this.byId("pdfViewer");
            oPdfViewer.setContent("<embed src='" + e.target.result + "' width='100%' height='400px' />");
            oPdfViewer.setVisible(true);
            this._uploadedFile = oFile; // Store file for upload
          }.bind(this);
          oReader.readAsDataURL(oFile);
        }

        this.byId("previewText").setVisible(true);
        this.byId("proceedButton").setVisible(true);
        MessageToast.show("File selected: " + oFile.name);
      } else {
        MessageToast.show("No file selected.");
      }
    },

    onProceedPress: function () {
      var oFile = this._uploadedFile;
      if (!oFile) {
        MessageToast.show("Please select a file before proceeding.");
        return;
      }

      BusyIndicator.show(0); // Show busy indicator

      var oFormData = new FormData();
      oFormData.append("file", oFile);

      // Add required metadata for DOX processing
      oFormData.append("documentType", "contract"); // Replace 'contract' with your document type
      oFormData.append("schema", "defaultSchema"); // Replace 'defaultSchema' with your schema
      oFormData.append("schemaVersion", "1.0"); // Replace '1.0' with your schema version

      // Backend endpoint for file upload and DOX processing
      var sUrl = "/api/upload-to-dox";

      fetch(sUrl, {
        method: "POST",
        body: oFormData
      })
        .then(response => {
          if (!response.ok) {
            throw new Error(`Server returned status ${response.status}`);
          }
          return response.json();
        })
        .then(data => {
          if (data.success) {
            // Update the fields with extracted data
            var oModel = this.getView().getModel("view");
            oModel.setProperty("/contractType", data.extracted.contractType || "");
            oModel.setProperty("/effectiveDate", data.extracted.effectiveDate || "");
            oModel.setProperty("/expiryDate", data.extracted.expiryDate || "");
            MessageToast.show("Fields updated with extracted data!");
          } else {
            throw new Error(data.message || "Failed to retrieve data from DOX service.");
          }
        })
        .catch(error => {
          console.error("Error:", error);
          MessageToast.show(error.message || "An error occurred during the process.");
        })
        .finally(() => {
          BusyIndicator.hide(); // Hide busy indicator
        });
    }
  });
});
