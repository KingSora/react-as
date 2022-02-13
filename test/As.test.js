/* eslint-disable react/prop-types */
import React, { useRef, useState, useCallback } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import * as cache from '../src/cache';
import As from '../src/As';

const cacheGetSpy = jest.spyOn(cache, 'getCacheEntry');
const cacheSetSpy = jest.spyOn(cache, 'setCacheEntry');

const clickTestId = 'click';
const fixedAttributeName = 'data-fixed';
const createFixedObj = (fixedName) => ({ [fixedAttributeName]: fixedName });

const ProxyComp = ({ comp: Comp, ...other }) => <Comp {...other} />;

const ProxyFragment = ({ comp: Comp, ...other }) => (
  <>
    <Comp {...other} />
  </>
);

const FunctionComponent = ({ title, children, ...other }) => {
  const ref = useRef(0);
  const [count, setCount] = useState(0);
  const onClick = useCallback(() => {
    setCount((curr) => curr + 1);
  }, [setCount]);
  ref.current += 1;

  return (
    <main title={title} onClick={onClick} data-testid={clickTestId} {...createFixedObj('func')} {...other}>
      <div>{`renders: ${ref.current}`}</div>
      <div>{children}</div>
      <div>{`count: ${count}`}</div>
    </main>
  );
};

const FunctionComponentB = React.memo(
  React.forwardRef(({ title, children, ...other }, ref) => (
    <section ref={ref} title={title} {...createFixedObj('funcB')} {...other}>
      {children}
    </section>
  ))
);

class ClassComponent extends React.Component {
  rerender = 0;

  constructor() {
    super();
    this.state = { count: 0 };
  }

  onClick = () => {
    this.setState((prevState) => ({
      count: prevState.count + 1,
    }));
  };

  render() {
    const { title, children, ...other } = this.props;
    const { count } = this.state;
    this.rerender += 1;
    return (
      <main title={title} onClick={this.onClick} data-testid={clickTestId} {...createFixedObj('class')} {...other}>
        <div>{`renders: ${this.rerender}`}</div>
        <div>{children}</div>
        <div>{`count: ${count}`}</div>
      </main>
    );
  }
}

class ClassComponentB extends React.PureComponent {
  render() {
    const { title, children, ...other } = this.props;
    return (
      <section title={title} {...createFixedObj('classB')} {...other}>
        {children}
      </section>
    );
  }
}

const getContainerTagName = (container) => container?.firstElementChild?.tagName?.toLocaleLowerCase?.();

const getContainerProp = (container, prop) => container?.firstElementChild?.getAttribute(prop);

const renderAs = (component, as, options) => render(<As component={component} as={as} options={options} />);

describe('As Component', () => {
  describe('Cache', () => {
    beforeEach(() => {
      cacheGetSpy.mockClear();
      cacheSetSpy.mockClear();
    });

    test('Repeating calls use cache', () => {
      const componentCache = () => <ProxyFragment comp="a" />;
      const asCache = () => <ProxyFragment comp="b" />;

      expect(cacheGetSpy).not.toHaveBeenCalled();
      expect(cacheSetSpy).not.toHaveBeenCalled();

      renderAs(componentCache, asCache);

      expect(cacheGetSpy).toHaveBeenCalled();
      expect(cacheSetSpy).toHaveBeenCalled();

      const setCalls = cacheSetSpy.mock.calls;

      renderAs(componentCache, asCache);

      expect(cacheSetSpy.mock.calls).toBe(setCalls);
    });

    test('Opt out of cache', () => {
      const componentCache = () => <ProxyFragment comp="a" />;
      const asCache = () => <ProxyFragment comp="b" />;

      expect(cacheGetSpy).not.toHaveBeenCalled();

      renderAs(componentCache, asCache, { cache: false });

      expect(cacheGetSpy).not.toHaveBeenCalled();
    });
  });

  describe('Passed component or passed "as"-component is null', () => {
    const testComponents = ['div', 'section', FunctionComponent, FunctionComponentB, ClassComponent, ClassComponentB]
      .map((componentType) => {
        const Comp = componentType;
        return [componentType, <Comp key={Date.now()} />];
      })
      .flat();

    test('Renders component when "as" component is null', () => {
      testComponents.forEach((component) => {
        const Comp = component;
        const { container } = renderAs(component, null);
        const { container: expectedContainer } = render(React.isValidElement(component) ? component : <Comp />);

        expect(container.innerHTML).toBe(expectedContainer.innerHTML);
      });
    });

    test('Renders "as" component when component is null', () => {
      testComponents.forEach((component) => {
        const Comp = component;
        const { container } = renderAs(null, component);
        const { container: expectedContainer } = render(React.isValidElement(component) ? component : <Comp />);

        expect(container.innerHTML).toBe(expectedContainer.innerHTML);
      });
    });

    test('Renders nothing if component and "as" component are null', () => {
      const { container } = renderAs();
      expect(container).toBeEmptyDOMElement();
    });
  });

  describe('Nested components return invalid root node', () => {
    const undefinedComponent = () => undefined;
    const nullComponent = () => null;
    const booleanComponent = () => false;
    const numberComponent = () => 3.141;
    const stringComponent = () => 'string';
    const fragmentComponent = () => <></>;

    const invalidRootNodeComponents = [nullComponent, undefinedComponent, stringComponent, numberComponent, booleanComponent, fragmentComponent];

    test('Wraps invalid root node components with strategy wrap', () => {
      const as = 'div';
      invalidRootNodeComponents.forEach((component) => {
        const { container } = renderAs(<ProxyComp comp={component} />, as);
        expect(getContainerTagName(container)).toBe(as);
      });
    });

    test('Leaves invalid root node components alone with strategy leave', () => {
      invalidRootNodeComponents.forEach((component) => {
        const { container } = renderAs(<ProxyComp comp={component} />, 'div', {
          strategy: 'leave',
        });
        expect(getContainerTagName(container)).toBe(undefined);
      });
    });

    test('Wraps direct "Fragment" with the wrap strategy', () => {
      const { container } = renderAs(<></>, 'div');
      expect(container).not.toBeEmptyDOMElement();
    });

    test('Leaves direct "Fragment" with the leave strategy', () => {
      const { container } = renderAs(<></>, 'div', { strategy: 'leave' });
      expect(container).toBeEmptyDOMElement();
    });
  });

  describe('Strategy and Recursive', () => {
    const as = <aside />;
    const testComponents = ['address', FunctionComponent, ClassComponent];
    const iterateTestComponents = (strategy, recursive, callback) => {
      testComponents.forEach((component) => {
        const proxy = () => <ProxyComp comp={component} />;
        const proxyFragment = () => <ProxyFragment comp={component} />;
        [proxy, proxyFragment].forEach((finalComponent, index) => {
          const { container } = renderAs(finalComponent, as, {
            strategy,
            recursive,
          });
          if (callback) {
            callback(container, index === 0 && recursive);
          }
        });
      });
    };

    [true, false].forEach((recursive) => {
      describe(`Rescursive: ${recursive}`, () => {
        test('Wraps the passed "as" component over the passed "component"', () => {
          iterateTestComponents('wrap', recursive, (container) => {
            // expect the "as" component to always be there
            expect(getContainerTagName(container)).toBe(as.type || as);
          });
        });

        test('Leaves the passed "component" alone if transformation was not successful', () => {
          iterateTestComponents('leave', recursive, (container, success) => {
            // expect the "as" component to be there if the transformation was successful
            if (success) {
              expect(getContainerTagName(container)).toBe(as.type || as);
            } else {
              expect(getContainerTagName(container)).not.toBe(as.type || as);
            }
          });
        });
      });
    });
  });

  describe('Transforms tag, props and fixed attributes', () => {
    const transformTests = [
      {
        components: [
          [<header key="h_1" />, 'header', null],
          [<footer key="h_2" />, 'footer', null],
        ],
        type: 'string',
      },
      {
        components: [
          [<FunctionComponent key="f_1" title="func" />, 'main', 'func'],
          [<FunctionComponentB key="f_2" title="funcB" />, 'section', 'funcB'],
        ],
        type: 'function',
      },
      {
        components: [
          [<ClassComponent key="c_1" title="class" />, 'main', 'class'],
          [<ClassComponentB key="c_2" title="classB" />, 'section', 'classB'],
        ],
        type: 'class',
      },
    ].map(({ components, type }) => {
      const componentConstructors = components.map(([component, tag, fixed]) => [component, tag, fixed, component?.props]);
      const componentElements = componentConstructors.map(([component, tag, fixed]) => [component?.type || component, tag, fixed]);
      return {
        components: [...componentConstructors, ...componentElements],
        type,
      };
    });

    transformTests.forEach((cTest) => {
      const { components: cTestComponents, type: cTestType } = cTest;

      describe(`${cTestType} components into:`, () => {
        transformTests.forEach((asTest) => {
          const { components: asTestComponents, type: asTestType } = asTest;

          test(`${asTestType} components`, () => {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            cTestComponents.forEach(([compTestComponent, _, compFixed]) => {
              asTestComponents.forEach(
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                ([asTestComponent, asTag, __, asProps]) => {
                  const { container, unmount } = renderAs(compTestComponent, asTestComponent);
                  const fixedAttr = getContainerProp(container, fixedAttributeName);

                  // correct tag
                  expect(getContainerTagName(container)).toBe(asTag);

                  // correct fixed attribute (fixed attributes are taken from component)
                  if (compFixed) {
                    expect(fixedAttr).toBe(compFixed);
                  }

                  // correct props (props are taken from as)
                  if (asProps) {
                    Object.keys(asProps).forEach((prop) => {
                      expect(getContainerProp(container, prop)).toBe(asProps[prop]);
                    });
                  }

                  // interactions
                  const clickableElm = screen.queryByTestId(clickTestId);
                  if (clickableElm) {
                    // multiple possible because nested rendering possible
                    expect(screen.getAllByText('renders: 1')).not.toHaveLength(0);
                    expect(screen.getAllByText('count: 0')).not.toHaveLength(0);

                    userEvent.click(clickableElm);

                    // multiple possible because no PureComponent / React.memo here
                    expect(screen.getAllByText('renders: 2')).not.toHaveLength(0);

                    // only one possible
                    expect(screen.getByText('count: 1')).toBeInTheDocument();
                  }

                  // clear
                  unmount();
                  container.remove();
                }
              );
            });
          });
        });
      });
    });
  });

  describe('Props overwriting', () => {
    test('Overwrites props', () => {
      const childrenCompStr = 'Children component';
      const childrenAsStr = 'Children as';
      const childrenOverwrittenStr = 'Children overwritten';
      renderAs(<FunctionComponent>{childrenCompStr}</FunctionComponent>, <div>{childrenAsStr}</div>);

      renderAs(<FunctionComponent>{childrenCompStr}</FunctionComponent>, <div>{childrenAsStr}</div>, {
        overwriteProps(componentProps, asProps) {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { children: childrenComp, ...restComp } = componentProps;
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { children: childrenAs, ...restAs } = asProps;

          return [{ ...restComp, children: childrenOverwrittenStr }, restAs];
        },
      });

      expect(screen.getByText(childrenAsStr)).toBeInTheDocument();
      expect(screen.getByText(childrenOverwrittenStr)).toBeInTheDocument();
    });

    test('Overwrite props function always gets objects as params', () => {
      const options = {
        overwriteProps(componentProps, asProps) {
          expect(componentProps).toBeDefined();
          expect(componentProps).not.toBeNull();
          expect(typeof componentProps).toBe('object');
          expect(asProps).toBeDefined();
          expect(asProps).not.toBeNull();
          expect(typeof asProps).toBe('object');

          return [componentProps, asProps];
        },
      };

      renderAs('div', 'a', options);
      renderAs(<div />, <main />, options);
      renderAs(<FunctionComponent />, <ClassComponentB />, options);
      renderAs(ClassComponent, ClassComponentB, options);
      renderAs(FunctionComponent, FunctionComponentB, options);
    });

    test('Overwrite props are ignored with incorrect return', () => {
      const returnsToTest = [undefined, null, {}, 1, '1', false];

      returnsToTest.forEach((returnedValue) => {
        const childrenComp = 'component child';
        const childrenAs = 'as child';
        const { container, unmount } = renderAs(<div>{childrenComp}</div>, <main>{childrenAs}</main>, {
          overwriteProps() {
            return returnedValue;
          },
        });

        expect(screen.getByText(childrenAs)).toBeInTheDocument();
        expect(container.querySelector('main')).toBeInTheDocument();

        unmount();
      });
    });
  });
});
