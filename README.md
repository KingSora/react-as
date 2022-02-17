# react-as
<center>Render react components as other components.
[Try it on the playground](https://stackblitz.com/edit/react-as-playground)
</center>

<h6 align="center">
    <a href="https://github.com/facebook/react/"><img src="https://img.shields.io/badge/React-%3E%3D16.0.0-61dafb?style=flat-square&logo=React" alt="React"></a>
    <a href="https://www.npmjs.com/package/react-as"><img src="https://img.shields.io/npm/v/react-as.svg?style=flat-square" alt="Version"></a>
    <a href="https://github.com/KingSora/react-as/blob/master/LICENSE"><img src="https://img.shields.io/github/license/kingsora/react-as.svg?style=flat-square" alt="License"></a>
</h6>

![Alt text](demo.png?raw=true "Demo Image")

## Why?
While developing with `react` I've experienced the need to adjust the tag or element type of my components. This was especially needed if I wanted the appearance of one component but the functionality of an other. Like rendering a `Link` as a `Button`, the link should have the functionality (and markup) of the `Link` component but the appearance of the `Button` component.

### How was this solved until now?

The solution was to introduce an `component`, `tag` or `as` property to the components which had the appearance but not the functionality. In the `Link` and `Button` example the `Button` would receive such an property. Many popular libraries are doing like this: [MUI](https://mui.com/api/button/#props), [Ant Design](https://ant.design/components/button/#API), [react-bootstrap](https://react-bootstrap.github.io/components/buttons/#button-props). The problem is that if more components should receive the functionality of the `Link` component, the property needs to be re-implement over and over again for each component. And this is where `react-as` comes in! **Not only can `react-as` replicate the current solution, its also possible to give the `Link` component the `as` prop instead of the `Button`.**

## Usage

The package comes with the `As` react component and the `transform` function. Both are exactly the same, but you can choose when to use what.

```jsx
import As, { transform } from "react-as";
import { Link } from "react-router-dom";
import Button from "./Button";

// with <As /> component
const MyComponent = () => (
  <As
    component={<Button theme="primary">Button</Button>}
    as={<Link to="/home" />}
  />
);

// with transform function
const MyComponent = () =>
  transform(<Button theme="primary">Button</Button>, <Link to="/home" />);
``` 

## How does it work?

JSX elements have a type called `ElementType` or `ComponentType`. This type is required and is always defined. This type can be split into 3 categories:
1. **intrinsic** type for elements like `div`, `p`, `a` etc.
2. **exotic** type for special react elements like `Fragment`, `Context`, `Memo` etc.
3. **custom** type for your own `Components`

Simply put the library traverses the root elements of your component until it encounters a intrinsic element, because this means this is the deepest root element. The it creates a new custom render function where it changes the type of this element to your desired `as` component type. 

If the deepest root element is not an intrinsic type but something else, the transformation is considered unsuccessful and you can decide with the `strategy` option how to handle the case. 

To not transform already known results over and over again, the library has a caching system where you can opt. out from with the `cache` option if you want.



## API

As already mentioned, the package has two main functions:
1. The `As` react component. (default and named export)
2. The `transform` function. (named export only)

Both are doing exactly the same. The `As` component is just a wrapper for the `transform` function.


### As Component Props

All props are optional and can be `null` or `undefined` as well.

<table>
    <thead>
        <tr>
            <th align="left">name</th>
            <th align="left">type</th>
            <th align="left">default</th>
            <th align="left">description</th>
        </tr>
    </thead>
    <tr>
        <td>component</td>
        <td><code>JSXElementConstructor | JSX.Element | string</code></td>
        <td><code>undefined</code></td>
        <td>The component which shall be transformed.</td>
    </tr>
    <tr>
        <td>as</td>
        <td><code>JSXElementConstructor | JSX.Element | string</code></td>
        <td><code>undefined</code></td>
        <td>The component into which the input component shall be transformed.</td>
    </tr>
    <tr>
        <td>options</td>
        <td><code>Options</code></td>
        <td><code>undefined</code></td>
        <td>The component into which the input component shall be transformed.</td>
    </tr>
</table>

### Options

The options object gives you more control of the transformation process.

<table>
    <thead>
        <tr>
            <th align="left">name</th>
            <th align="left">type</th>
            <th align="left">default</th>
            <th align="left">description</th>
        </tr>
    </thead>
    <tr>
        <td>strategy</td>
        <td><code>"wrap" | "leave"</code></td>
        <td><code>"wrap"</code></td>
        <td>The strategy how to continue in case the transformation process would fail. <br/> 
        <b>wrap</b>: wrap the "component" always with the "as" component <br/> 
        <b>leave</b>: leave the "component" alone and do nothing if the transformation wasn't successful
		</td>
    </tr>
    <tr>
        <td>recursive</td>
        <td><code>boolean</code></td>
        <td><code>true</code></td>
        <td>Try to transform the component recursively if the transformation isn't successful after the first iteration.</td>
    </tr>
    <tr>
        <td>cache</td>
        <td><code>boolean</code></td>
        <td><code>true</code></td>
        <td>Whether to use cache instead of transforming already known results again.</td>
    </tr>
    <tr>
        <td>overwriteProps</td>
        <td><code>OverwriteProps</code></td>
        <td><code>undefined</code></td>
        <td>A function which gets the props of both components as arguments and returns a object with the combined adapted props.</td>
    </tr>
</table>

### OverwriteProps

This functions allows you to control which properties are passed to the transformed component.
The function takes the `componentProps` as its first argument, the `"as" component props` as its second argument and should return an object which represents the `final props` which are passed to the resulting component.

The simplified typescript type declaration is:

```ts
type OverwriteProps<CompProps, AsProps> = (
  compProps: CompProps,
  asProps: AsProps
) => CompProps & AsProps;
```

### Types

The package comes with the `InputComponentProps` helper type which is here to help you write a correctly typed `OverwriteProps` function. Because `typescript` can't interfere the type of a `JSX.Element` you have to do it yourself, For all other cases the `OverwriteProps` can interfere the correct `props` type for you automatically.

```tsx
import As, { InputComponentProps }  from 'react-as';

<As
  component={<div>Div as Paragraph</div>}
  as={<MyComponent />}
  options={{
    overwriteProps: (componentProps: InputComponentProps<'div'>, asProps: InputComponentProps<MyComponent>) => ({
      ...componentProps,
      ...asProps,
    }),
  }}
/>
```
In the example above I'm using the `InputComponentProps` helper type to get the correct `props` type for the two components I'm transforming.

## License

MIT 