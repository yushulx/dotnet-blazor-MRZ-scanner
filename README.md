# .NET Blazor MRZ Reader & Scanner
This is a .NET Blazor WebAssembly project that can read and scan **MRZ (Machine Readable Zone)** from a passport or ID card using [Dynamsoft Label Recognizer SDK](https://www.npmjs.com/package/dynamsoft-label-recognizer).

https://github.com/yushulx/dotnet-blazor-MRZ-scanner/assets/2202306/af19cdb7-9588-4223-9b1b-aa0a64c1b889

## Try Online Demo
[https://yushulx.me/dotnet-blazor-MRZ-scanner/](https://yushulx.me/dotnet-blazor-MRZ-scanner/)

## Getting Started
1. Request a [free trial license](https://www.dynamsoft.com/customer/license/trialLicense?product=dlr&utm_source=github&utm_campaign=dotnet-blazor-mrz-scanner) of Dynamsoft Label Recognizer.
2. Update the license key in `Index.razor`:
    
    ```csharp
    initialized = await JSRuntime.InvokeAsync<Boolean>("jsFunctions.initSDK", "LICENSE-KEY");
    ``````
3. Run the app:

    ```
    dotnet watch run
    ```

    ![dotnet-blazor-mrz-scanner](https://github.com/yushulx/dotnet-blazor-MRZ-scanner/assets/2202306/1869a6db-1d49-4835-bceb-af0f35c747c7)
