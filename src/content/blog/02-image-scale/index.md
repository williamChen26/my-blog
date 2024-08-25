---
title: "图形处理-图形缩放算法研究"
description: "日常工作记录"
date: "2023-06-01"
---

---

针对图形缩放的处理，我们可以使用cavnas的`scale`能力，在做编辑器的实践过程中，如果用`scale` 的话，放大一定倍数的情况下，位图会出现一定的模糊状态，为此我特地研究了目前主流的图形缩放算法，常有的算法有：最邻近插值（Nearest Neighbor Interpolation）、双线性插值（Bilinear Interpolation）、双三次插值（Bicubic Interpolation）、Lanczos插值（Lanczos Interpolation）、Sinc插值（Sinc Interpolation）。

## 最邻近插值

最邻近插值（Nearest Neighbor Interpolation）是一种简单且常用的图像缩放算法。其基本思想是在对图像进行放大或缩小时，通过选择离目标像素位置最近的原始像素的颜色值来填充目标像素。这意味着在放大图像时，不会生成新的颜色值，而是直接复制原有的像素点；在缩小图像时，则会丢弃一些像素信息。

我们可以看下放大2倍的状态：

![image.png](./image.png)

可以看到效果比较一般，虽然算法比较简单快速，但是效果不够平滑，出现锯齿现象或块状效应。

## 双线性插值

双线性插值（Bilinear Interpolation）的公式如下：

$$
(x,y)≈(1−t)(1−u)Q11+t(1−u)Q21+(1−t)uQ12+tuQ22
$$

其中：

$$
t=(x−x1)/(x2−x1)t = (x - x_1) / (x_2 - x_1)t=(x−x1)/(x2−x1)
$$

$$
u=(y−y1)/(y2−y1)u = (y - y_1) / (y_2 - y_1)u=(y−y1)/(y2−y1)
$$

双线性插值的基本思想是，通过逆缩放比计算得出目标图像中的像素点在原始图像中的四个邻近像素信息，再进行加权平均，来计算目标图像中每个像素点的grba。

![image.png](./image_1.png)

可以看出来相比最邻近插值，双线性插值算法会更佳复杂，放大后的效果更佳平滑，减少了锯齿和块状效应，依旧看起来是有些模糊。

## 双三次插值

双三次插值（Bicubic Interpolation）是一种更高级的图像缩放算法，它在插值过程中考虑了更多的像素点，因此可以生成比双线性插值更平滑和细致的图像。双三次插值不仅在水平和垂直方向上进行插值，还考虑了周围16个像素点（4×4的区域），而不仅仅是四个邻近像素点。

### 公式

在双三次插值中，目标像素的颜色值是通过以下步骤计算的：

1. **水平插值**：
    - 对目标像素在水平（x）方向上，使用三次多项式对四个像素进行插值，得到两个中间值。
2. **垂直插值**：
    - 对这两个中间值在垂直（y）方向上，使用三次多项式进行插值，得到最终的像素值。

公式示例如下：

$$
P(x, y) = \sum_{i=0}^{3} \sum_{j=0}^{3} p(i, j) \cdot w_x(i) \cdot w_y(j)
$$

其中：

- $p(i, j)$ 是目标位置的四个邻近像素的颜色值。
- $w_x(i)$ 和$w_y(j)$是计算出的水平和垂直方向上的权重值。
    
    

效果如下：

![image.png](./image_2.png)

由于考虑了更多的像素点，双三次插值能生成非常平滑和细腻的图像，减少了模糊和锯齿现象。缺点是涉及更多的像素点和三次多项式计算，计算量比双线性插值要大。

## Lanczos插值

Lanczos 插值通过对多个相邻像素点的加权平均来计算目标像素的颜色值，权重由 sinc 函数和一个窗口函数决定。Lanczos 插值的核心思想是将输入图像看作是一个离散的采样信号，通过 sinc 函数对其进行重建，从而得到目标图像。

Lanczos 插值的公式如下：

$$
P(x, y) = \sum_{i=-a}^{a} \sum_{j=-a}^{a} p(x-i, y-j) \cdot \text{Lanczos}(x-i) \cdot \text{Lanczos}(y-j)
$$

$$
\text{Lanczos}(z) = \frac{\sin(\pi z)}{\pi z} \cdot \frac{\sin(\pi z / a)}{\pi z / a}
$$


- $p(x-i, y-j)$ 是原始图像中与目标像素最接近的像素点的颜色值。
- $\text{Lanczos}(z) = \frac{\sin(\pi z)}{\pi z} \cdot \frac{\sin(\pi z / a)}{\pi z / a}$，其中$\text{sinc}(z) = \frac{\sin(\pi z)}{\pi z}$。
- $a$ 是 Lanczos 核的参数，通常选择 2 或 3

![image.png](./image_3.png)

Lanczos 插值可以保留图像中的高频细节，生成清晰、锐利的缩放图像。与双三次插值相比，Lanczos 插值更能减少伪影和模糊现象。

由于涉及多个像素点和复杂的 sinc 函数计算，Lanczos 插值的计算开销较大。

## 不同算法的效率对比

我通过多次缩放，取平均值，如下：

1. 最邻近插值： 19.299999952316284
2. 双线性插值：67.89999997615814
3. 双三次插值： 347.5
4. Lanczos插值：2718

demo地址：https://github.com/williamChen26/image-scales

## 踩坑记录：

在获取ImageData时，遇到一个小坑，代码如下：

```jsx
async function fetchImageData(
  input: string | ArrayBuffer | null
): Promise<ImageDataType> {
  if (input === null) throw new Error("Input is null");

  if (typeof input === "string") {
    const response = await fetch(input);
    const arrayBuffer = await response.arrayBuffer();
    console.log('arrayBuffer: ', arrayBuffer);
    return new Uint8ClampedArray(arrayBuffer);
  } else {
    return new Uint8ClampedArray(input);
  }
}
```

将输入的图像信息转`Uint8ClampedArray` 时，发现`length` 小于$4 * witdh * hejght$，原因是直接从 URL 获取的 `ArrayBuffer` 或者在 很可能包含的是压缩格式（如 JPEG 或 PNG），而不是未压缩的 RGBA 像素数据。因此，直接将它转换为 `Uint8ClampedArray` 并尝试创建 `ImageData` 会导致问题出现。

要正确获取图像的像素数据（RGBA 格式），你需要先将图像解码为一个 `ImageBitmap` 或 `HTMLImageElement`，然后使用 Canvas 绘制图像并从中获取像素数据。

```jsx
async function fetchImageData(
  input: string | ArrayBuffer | null
): Promise<Uint8ClampedArray> {
  if (input === null) throw new Error("Input is null");

  let imageBitmap: ImageBitmap;

  if (typeof input === "string") {
    const response = await fetch(input);
    const blob = await response.blob();
    imageBitmap = await createImageBitmap(blob);
  } else {
    const blob = new Blob([input]);
    imageBitmap = await createImageBitmap(blob);
  }

  const canvas = document.createElement('canvas');
  canvas.width = imageBitmap.width;
  canvas.height = imageBitmap.height;

  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error("Could not get Canvas 2D context");

  ctx.drawImage(imageBitmap, 0, 0);
  
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  return imageData.data; // Uint8ClampedArray
}
```