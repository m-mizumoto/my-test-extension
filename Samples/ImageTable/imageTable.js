// @ts-check
'use strict';

// Wrap everything in an anonymous function to avoid polluting the global namespace
(async () => {

  const main = async () => {
    try {
      console.log('test app main start');
      /** @type import('@tableau/extensions-api-types').Extensions */
      await tableau.extensions.initializeAsync();

      // ワークシート
      const dashboard = tableau.extensions.dashboardContent.dashboard;
      for await (const worksheet of dashboard.worksheets) {
        if (worksheet.name !== 'CRレポート_CRレポート') continue;
        console.log({ worksheet });

        // フィルタが適用されているデータ // NOTE: 使うのはこっち
        const summaryData = await worksheet.getSummaryDataAsync();
        console.log({ summaryData });

        /** @type {string[][]} */
        const tableData = summaryData.data.map((d) => {
          return d.map((v) => v.value);
        })
        console.log({ tableData });

        // テーブルの作成
        await createDataTable(tableData);

        // @ts-ignore // NOTE: このシートのフィルタ操作のイベントを登録
        worksheet.addEventListener('filter-changed', async () => {
          await createSummaryDataTable();  // テーブルを更新
        })
      }

      console.log('test app main end');
    } catch (error) {
      console.error(error);
      console.log('Error while Initializing: ' + error.toString());
    }
  }

  /**
   * フィルタ変更時の EventListener に登録
   * シート名を指定してフィルタ済みデータを取得しテーブル更新
   */
  async function createSummaryDataTable() {
    console.log('テーブルの更新');
    const dashboard = tableau.extensions.dashboardContent.dashboard;
    for await (const worksheet of dashboard.worksheets) {
      if (worksheet.name !== 'CRレポート_CRレポート') continue;
      const summaryData = await worksheet.getSummaryDataAsync();
      /** @type {string[][]} */
      const tableData = summaryData.data.map((d) => {
        return d.map((v) => v.value);
      })
      await createDataTable(tableData);
    }
  }

  /**
   * テーブルの作成
   * https://datatables.net/ を使用
   * 先頭列を image タグに置き換えるカスタム
   * @param {string[][]} data データ
   */
  async function createDataTable(data) {
    // @ts-ignore // NOTE: ts-check を無視
    $('#summary-data-table').DataTable({
      destroy: true,
      data: data,
      responsive: true,
      'rowsGroup': [0],
      columnDefs: [
        {
          targets: 0,
          render: function (data) {
            return '<img src="' + data + '" style="max-height: 70px; max-width: 150px; text-align: center; display: block; margin: auto;" >'
          }
        }
      ],
      pagingType: 'full_numbers',
    });
  }

  await main();
})();
