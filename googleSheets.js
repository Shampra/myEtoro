//- Google Sheets module
const googleSheets = (() => {
    let sheetData = null;

    function fetchData(id, sheetName) {
        return new Promise((resolve, reject) => {
            let Expiration_data = sessionStorage.getItem("dataMyEtoro_expiration");
            let now = new Date().getTime();
            var tmpSheetData = JSON.parse(sessionStorage.getItem("dataMyEtoro"));

            if (tmpSheetData && now < Expiration_data) {
                sheetData = tmpSheetData;
                resolve(sheetData);
                return;
            }

            const reqJson = `https://script.google.com/macros/s/AKfycbwDlJD_bcxGqXLK4rSpf0Yx-xBwtyGVeI3v4GipDFtlJiNWDIdU/exec?id=${id}&sheet=${sheetName}`;

            $.getJSON(reqJson)
                .done(data => {
                    sheetData = data;
                    sessionStorage.setItem("dataMyEtoro", JSON.stringify(data));
                    let expiration = new Date().getTime() + (1000 * 60 * 30); // expiration à 30mn
                    sessionStorage.setItem("dataMyEtoro_expiration", expiration);
                    resolve(sheetData);
                })
                .fail((jqxhr, textStatus, error) => {
                    console.error(`Google Sheets request failed: ${textStatus}, ${error}`);
                    reject(error);
                });
        });
    }

    function getData() {
        return sheetData;
    }

    return {
        fetchData,
        getData
    };
})();
