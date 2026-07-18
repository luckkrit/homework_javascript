// 1. รอฟังคำสั่งจาก Main Thread
onmessage = function (event) {
    // ข้อมูลที่ Main Thread ส่งมาจะอยู่ใน event.data
    console.log("คนงานได้รับงานแล้ว:", event.data);

    // 2. ประมวลผลใน Thread ตัวเอง
    const result = event.data.task.map(x => x * 10);

    // 3. ส่งผลลัพธ์กลับไปให้ Main Thread
    postMessage({ status: "เสร็จแล้ว", output: result });
};
