/**
 * 图片处理工具
 */
import React, { useEffect, useRef, useState } from "react";
import ReactDOM from "react-dom";
import { Button, Checkbox, message } from "antd";
import { useGlobalContext } from "@/hooks/useGlobalContext";
import { clipRect } from "utils/imageUtil";
import { ImgInfo } from "../../index";
import styles from "./index.module.scss";

interface ClipProps {
  imgInfo: ImgInfo;
  exportImage: (imageData: ImageData) => void;
  imgDragOver: boolean;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
  onClear: () => void;
}

enum Contact {
  "leftUp",
  "up",
  "rightUp",
  "right",
  "rightDown",
  "down",
  "leftDown",
  "left",
}

const clipBoxMinWidthHeight = 10; // 裁剪框的最小宽高

const Clip = (props: ClipProps) => {
  const {
    imgInfo,
    exportImage,
    imgDragOver,
    onDragOver,
    onDragLeave,
    onDrop,
    onClear,
  } = props;
  const { scrollTop } = useGlobalContext();
  const [imgSizeQualified, setImgSizeQualified] = useState<boolean>(false);
  const [retainOriginalSize, setRetainOriginalSize] = useState<boolean>(false);
  const doingClip = useRef<boolean>(false);
  const clipBoxRef = useRef<HTMLDivElement>(null);

  const defaultWidth = Math.max(
    Math.floor(imgInfo.width / 2),
    clipBoxMinWidthHeight
  );
  const defaultHeight = Math.max(
    Math.floor(imgInfo.height / 2),
    clipBoxMinWidthHeight
  );
  const [clipBoxWidth, setClipBoxWidth] = useState<number>(defaultWidth);
  const [clipBoxHeight, setClipBoxHeight] = useState<number>(defaultHeight);
  const [clipBoxTop, setClipBoxTop] = useState<number>(0);
  const [clipBoxLeft, setClipBoxLeft] = useState<number>(0);

  const isKeyDown = useRef<boolean>(false);
  const isGetar = useRef<boolean>(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const leftBoxRef = useRef<HTMLDivElement>(null);
  const leftBoxWidth = useRef<number>(0);
  const leftBoxHeight = useRef<number>(0);
  const beforeMouseX = useRef<number>(0);
  const beforeMouseY = useRef<number>(0);
  const clipBoxBeforeLeft = useRef<number>(0);
  const clipBoxBeforeTop = useRef<number>(0);
  const contact = useRef<Contact>();

  // 获取元素相对于屏幕左边和上边的距离，利用offsetLefe
  const getPosition = (node: HTMLElement) => {
    var left = node.offsetLeft;
    var top = node.offsetTop;
    let parent: HTMLElement = node.offsetParent as HTMLElement; //获取父元素
    while (parent != null) {
      left += parent.offsetLeft;
      top += parent.offsetTop;
      parent = parent.offsetParent as HTMLElement;
    }
    return {
      left: left,
      top: top,
    };
  };

  //right移动
  const rightMove = (e: React.MouseEvent) => {
    let x = e.clientX; //鼠标X坐标
    const leftBoxNode = ReactDOM.findDOMNode(
      leftBoxRef.current
    ) as HTMLDivElement;
    const { left } = getPosition(leftBoxNode);
    const minX = left;
    const maxX = minX + leftBoxWidth.current;
    // const maxX = minX + leftBoxWidth.current - 4;
    if (x > maxX) {
      x = maxX;
    } else if (x < minX) {
      x = minX;
    }
    const clipBoxNode = ReactDOM.findDOMNode(
      clipBoxRef.current
    ) as HTMLDivElement;
    const widthBefore = clipBoxWidth - 2;
    const mainX = getPosition(clipBoxNode).left;
    const addWidth = x - widthBefore - mainX;
    setClipBoxWidth(
      Math.max(Math.floor(widthBefore + addWidth), clipBoxMinWidthHeight)
    );
  };

  //up移动
  const upMove = (e: React.MouseEvent) => {
    let y = e.clientY + scrollTop; //鼠标纵坐标
    const leftBoxNode = ReactDOM.findDOMNode(
      leftBoxRef.current
    ) as HTMLDivElement;
    const { top } = getPosition(leftBoxNode);
    const minY = top;
    const clipBoxNode = ReactDOM.findDOMNode(
      clipBoxRef.current
    ) as HTMLDivElement;
    const mainY = getPosition(clipBoxNode).top;
    const maxY = mainY + clipBoxNode.offsetHeight;
    // const maxY = mainY + clipBoxNode.offsetHeight - 4;
    if (y < minY) {
      y = minY;
    } else if (y > maxY) {
      y = maxY;
    }
    setClipBoxTop(
      Math.min(
        Math.floor(clipBoxTop + y - mainY),
        leftBoxHeight.current - clipBoxMinWidthHeight
      )
    );
    const heightBefore = clipBoxHeight;
    setClipBoxHeight(
      Math.max(Math.floor(heightBefore + mainY - y), clipBoxMinWidthHeight)
    );
  };

  //left移动
  const leftMove = (e: React.MouseEvent) => {
    let x = e.clientX; //鼠标横坐标
    const leftBoxNode = ReactDOM.findDOMNode(
      leftBoxRef.current
    ) as HTMLDivElement;
    const { left } = getPosition(leftBoxNode);
    const minX = left;
    const clipBoxNode = ReactDOM.findDOMNode(
      clipBoxRef.current
    ) as HTMLDivElement;
    const mainX = getPosition(clipBoxNode).left;
    const maxX = mainX + clipBoxNode.offsetWidth;
    // const maxX = mainX + clipBoxNode.offsetWidth - 4;
    if (x < minX) {
      x = minX;
    } else if (x > maxX) {
      x = maxX;
    }
    setClipBoxLeft(
      Math.min(
        Math.floor(clipBoxLeft + x - mainX),
        leftBoxWidth.current - clipBoxMinWidthHeight
      )
    );
    const widthBefore = clipBoxWidth;
    setClipBoxWidth(
      Math.max(Math.floor(widthBefore + mainX - x), clipBoxMinWidthHeight)
    );
  };

  //down移动
  const downMove = (e: React.MouseEvent) => {
    let y = e.clientY + scrollTop;
    const leftBoxNode = ReactDOM.findDOMNode(
      leftBoxRef.current
    ) as HTMLDivElement;
    const { top } = getPosition(leftBoxNode);
    const minY = top;
    const maxY = minY + leftBoxHeight.current;
    // const maxY = minY + leftBoxHeight.current - 4;
    if (y < minY) {
      y = minY;
    } else if (y > maxY) {
      y = maxY;
    }
    const clipBoxNode = ReactDOM.findDOMNode(
      clipBoxRef.current
    ) as HTMLDivElement;
    const heightBefore = clipBoxHeight - 2;
    const mainY = getPosition(clipBoxNode).top;
    const addHeight = y - heightBefore - mainY;
    setClipBoxHeight(
      Math.max(Math.floor(heightBefore + addHeight), clipBoxMinWidthHeight)
    );
  };

  const onMouseMove = (e: React.MouseEvent) => {
    //移动整个选框
    if (isGetar.current) {
      const clipBoxNode = ReactDOM.findDOMNode(
        clipBoxRef.current
      ) as HTMLDivElement;
      const { offsetWidth, offsetHeight } = clipBoxNode;
      const xChange = e.clientX - beforeMouseX.current;
      const yChange = e.clientY - beforeMouseY.current;
      const top = Math.floor(clipBoxBeforeTop.current + yChange);
      const left = Math.floor(clipBoxBeforeLeft.current + xChange);
      if (top < 0) {
        setClipBoxTop(0);
      } else if (top > leftBoxHeight.current - offsetHeight - 2) {
        setClipBoxTop(leftBoxHeight.current - offsetHeight - 2);
      } else {
        setClipBoxTop(top);
      }
      if (left < 0) {
        setClipBoxLeft(0);
      } else if (left > leftBoxWidth.current - offsetWidth - 2) {
        setClipBoxLeft(leftBoxWidth.current - offsetWidth - 2);
      } else {
        setClipBoxLeft(left);
      }
    }
    //移动选框边线
    if (isKeyDown.current) {
      switch (contact.current) {
        case Contact.right:
          rightMove(e);
          break;
        case Contact.up:
          upMove(e);
          break;
        case Contact.left:
          leftMove(e);
          break;
        case Contact.down:
          downMove(e);
          break;
        case Contact.leftUp:
          leftMove(e);
          upMove(e);
          break;
        case Contact.leftDown:
          leftMove(e);
          downMove(e);
          break;
        case Contact.rightUp:
          rightMove(e);
          upMove(e);
          break;
        case Contact.rightDown:
          rightMove(e);
          downMove(e);
          break;
      }
    }
  };

  const onMouseDownDot = (e: React.MouseEvent, cont: Contact) => {
    e.stopPropagation();
    // @ts-ignore
    e.target.style.backgroundColor = "#DC0000";
    isKeyDown.current = true;
    contact.current = cont;
  };

  const onMouseDownClipBox = (e: React.MouseEvent) => {
    beforeMouseX.current = e.clientX;
    beforeMouseY.current = e.clientY;
    const clipBoxNode = ReactDOM.findDOMNode(
      clipBoxRef.current
    ) as HTMLDivElement;
    clipBoxBeforeTop.current = clipBoxNode.offsetTop;
    clipBoxBeforeLeft.current = clipBoxNode.offsetLeft;
    isGetar.current = true;
  };

  const onMouseUp = () => {
    isKeyDown.current = false;
    isGetar.current = false;
    if (clipBoxRef.current) {
      Array.prototype.forEach.call(clipBoxRef.current.children, (item) => {
        item.style.backgroundColor = "#FF8E9E";
      });
    }
  };

  useEffect(() => {
    const { width, height } = imgInfo;
    if (width <= 20 || height <= 20) {
      message.error("请选20x20以上尺寸的图片");
      setImgSizeQualified(false);
      return;
    } else if (width >= 1350 || height >= 1350) {
      message.error("请选择1350x1350以下尺寸的图片");
      setImgSizeQualified(false);
      return;
    }

    const defaultWidth = Math.max(
      Math.floor(imgInfo.width / 2),
      clipBoxMinWidthHeight
    );
    const defaultHeight = Math.max(
      Math.floor(imgInfo.height / 2),
      clipBoxMinWidthHeight
    );
    setClipBoxWidth(defaultWidth);
    setClipBoxHeight(defaultHeight);
    setClipBoxLeft(0);
    setClipBoxTop(0);
    if (imgSizeQualified) {
      if (leftBoxRef.current) {
        const leftBoxNode = ReactDOM.findDOMNode(
          leftBoxRef.current
        ) as HTMLDivElement;
        const { offsetWidth, offsetHeight } = leftBoxNode;
        leftBoxWidth.current = offsetWidth;
        leftBoxHeight.current = offsetHeight;
      }
    } else {
      setImgSizeQualified(true);
    }
    setRetainOriginalSize(false);
  }, [imgInfo]);

  useEffect(() => {
    if (imgSizeQualified && leftBoxRef.current) {
      const leftBoxNode = ReactDOM.findDOMNode(
        leftBoxRef.current
      ) as HTMLDivElement;
      const { offsetWidth, offsetHeight } = leftBoxNode;
      leftBoxWidth.current = offsetWidth;
      leftBoxHeight.current = offsetHeight;
    }
  }, [imgSizeQualified]);

  // 点击裁剪
  const onClip = () => {
    if (doingClip.current) return;
    doingClip.current = true;
    const newImageData = clipRect(
      imgInfo.imageData as ImageData,
      clipBoxWidth,
      clipBoxHeight,
      clipBoxTop,
      clipBoxLeft,
      retainOriginalSize
    );
    if (newImageData) {
      exportImage(newImageData);
    } else {
      message.error("转换失败");
    }
    doingClip.current = false;
  };

  return (
    <div className={styles.container}>
      <div
        className={styles.imgBox}
        style={{ borderColor: imgDragOver ? "green" : "#2320e5" }}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
      >
        {imgSizeQualified && (
          <div
            className={styles.content}
            style={{
              width: `${imgInfo.width}px`,
              height: `${imgInfo.height}px`,
            }}
            onMouseMove={onMouseMove}
            onMouseUp={onMouseUp}
            onMouseLeave={onMouseUp}
            ref={contentRef}
          >
            <div className={styles.leftBox} ref={leftBoxRef}>
              <img src={imgInfo.imgUrl} />
              <div
                className={styles.clipBox}
                style={{
                  position: "absolute",
                  width: `${clipBoxWidth}px`,
                  height: `${clipBoxHeight}px`,
                  top: `${clipBoxTop}px`,
                  left: `${clipBoxLeft}px`,
                }}
                onMouseDown={onMouseDownClipBox}
                ref={clipBoxRef}
              >
                <div
                  className={`${styles.dot} ${styles.leftUp}`}
                  onMouseDown={(e) => onMouseDownDot(e, Contact.leftUp)}
                ></div>
                <div
                  className={`${styles.dot} ${styles.up}`}
                  onMouseDown={(e) => onMouseDownDot(e, Contact.up)}
                ></div>
                <div
                  className={`${styles.dot} ${styles.rightUp}`}
                  onMouseDown={(e) => onMouseDownDot(e, Contact.rightUp)}
                ></div>
                <div
                  className={`${styles.dot} ${styles.right}`}
                  onMouseDown={(e) => onMouseDownDot(e, Contact.right)}
                ></div>
                <div
                  className={`${styles.dot} ${styles.rightDown}`}
                  onMouseDown={(e) => onMouseDownDot(e, Contact.rightDown)}
                ></div>
                <div
                  className={`${styles.dot} ${styles.down}`}
                  onMouseDown={(e) => onMouseDownDot(e, Contact.down)}
                ></div>
                <div
                  className={`${styles.dot} ${styles.leftDown}`}
                  onMouseDown={(e) => onMouseDownDot(e, Contact.leftDown)}
                ></div>
                <div
                  className={`${styles.dot} ${styles.left}`}
                  onMouseDown={(e) => onMouseDownDot(e, Contact.left)}
                ></div>
              </div>
            </div>
          </div>
        )}
      </div>
      <div className={styles.operationBtns}>
        <div>
          <Checkbox
            className={styles.operationBtn}
            checked={retainOriginalSize}
            onChange={(e) => {
              setRetainOriginalSize(e.target.checked);
            }}
          >
            是否保留原尺寸
          </Checkbox>
          <Button
            type="primary"
            className={styles.operationBtn}
            onClick={onClip}
            disabled={!imgSizeQualified}
          >
            裁剪
          </Button>
        </div>
        <Button ghost type="primary" onClick={onClear}>
          清空
        </Button>
      </div>
    </div>
  );
};

export default Clip;