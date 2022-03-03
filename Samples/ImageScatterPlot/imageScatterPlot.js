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
        if (worksheet.name !== 'CRレポート_散布図') continue;
        console.log({ worksheet });

        // フィルタが適用されているデータ // NOTE: 使うのはこっち
        const summaryData = await worksheet.getSummaryDataAsync();
        console.log({ summaryData });

        /** @type {string[][]} */
        const tableData = summaryData.data.map((d) => {
          return d.map((v) => v.value);
        })
        console.log({ tableData });

        const scatterDate = await Promise.all(summaryData.data.map(async (d) => {
          const img = await imgLoad(d[0].value)
          img.width = 100
          img.height = 100
          return {
            data: [{ x: d[2].value, y: d[1].value }],
            elements: { point: { radius: 10, pointStyle: img } }
          }
        }));
        console.log({ scatterDate });

        await creatScatter(scatterDate);

        // @ts-ignore // NOTE: このシートのフィルタ操作のイベントを登録
        worksheet.addEventListener('filter-changed', async () => {
          await createSummaryScatterPlot();  // テーブルを更新
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
  async function createSummaryScatterPlot() {
    console.log('テーブルの更新');
    const dashboard = tableau.extensions.dashboardContent.dashboard;
    for await (const worksheet of dashboard.worksheets) {
      if (worksheet.name !== 'CRレポート_散布図') continue;
      const summaryData = await worksheet.getSummaryDataAsync();

      const scatterDate = await Promise.all(summaryData.data.map(async (d) => {
        const img = await imgLoad(d[0].value)
        return {
          data: [{ x: d[2].value, y: d[1].value }],
          elements: { point: { radius: 10, pointStyle: img } }
        }
      }));
      console.log({ scatterDate });
      await creatScatter(scatterDate);
    }
  }

  const imgLoad = async (src) => {
    console.log(src)
    const image = new Image()
    // image.width = 100
    // image.height = 100
    try {
      return new Promise(resolve => {
        image.onload = () => {
          resolve(image)
        }
        image.src = src
      })
    } catch (error) {
      return new Promise(resolve => {
        image.onload = () => {
          resolve(image)
        }
        image.src = "./no-image.png"
      })
    }
  }

  /**
   * テーブルの作成
   * https://datatables.net/ を使用
   * 先頭列を image タグに置き換えるカスタム
   * @param {string[][]} data データ
   */
  async function creatScatter(data) {

    const urls = [
      'https://image.itmedia.co.jp/business/articles/2202/22/ko_neko_00.jpg',
      "https://blogger.googleusercontent.com/img/a/AVvXsEitupdDBu3SXzqVl_iQrDPM9YCXVvJQuFA3EvxY95sbJH0ns-d3JKHcRmo4_rTjT1ouDzZWChACgMXklQijceV933JGo55wPqgvEWzQjI6ndjNP4d1YOSCZwPwCwphj8B_93x40uihg_srz5KZoCp4jJ3FOVxjbCCTUJPykhPVlsrIQ0bCWGV0DNep_Sg=s400",
      "https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEhXpRgyT1KR2K6z7D8eNIYhV3CYcjEjJFwnzQOJt4Xat2y2Oc0cfd3TkPxjnhOrDtvwoe4hfVbaFMiDd2o3V10fUoSau-JXri8P4f_9t3IEyyHteRkkE8feX4cFqa9JEu4q9YWHGFus0kxOPHFabt0cOzMIqF4E4hx5WWjsoeBJQJP_KU5mBCjLvBdT2A/s180-c/thumbnail_vegetable_paprika_cut.jpg"
    ]

    // afterDrawの後にImageを差し込む
    // const images = [];

    // for await (const url of urls) {
    //   try {
    //     const img = await imgLoad(url);
    //     console.log(img.width)
    //     img.width = 100;
    //     images.push(img);
    //   } catch (error) {
    //     const img = await imgLoad("./no-image.jpeg");
    //     console.log(img.width)
    //     img.width = 100;
    //     images.push(img);

    //   }
    // }

    // チャートの生成（イメージのload後に実行する）
    // sun_image.addEventListener("load", function () {
    let ctx = (/** @type {HTMLCanvasElement} */(document.getElementById('chart'))).getContext('2d');
    // ctx.width = 500;
    // ctx.height = 500;

    // const { Chart } = require('chart.js');

    /** @type import('chart.js').Chart */
    const myCart = new Chart(ctx, {
      type: 'bubble',
      // data: {
      //   datasets: [
      //     {
      //       data: [
      //         { x: 1, y: 1 },
      //       ],
      //       label: "aaaaaa",
      //       elements: { point: { radius: 10, pointStyle: images[0] } }
      //     }, {
      //       data: [
      //         { x: 1, y: 2 },
      //       ],
      //       label: "bbbbb",
      //       elements: { point: { radius: 10, pointStyle: images[1] } }
      //     }],
      // },
      data: { datasets: data },
      options: {
        responsive: true,
        plugins: {
          legend: {
            display: false
          }
        }
        // elements: { point: { radius: 10, pointStyle: images[0] } }
      },
    });

    console.log({ myCart });

    // }, false);


  }

  await main();
})();
