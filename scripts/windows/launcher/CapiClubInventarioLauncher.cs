using System;
using System.Diagnostics;
using System.IO;

internal static class CapiClubInventarioLauncher
{
    private const string AppName = "CapiClub Inventario";

    private static int Main()
    {
        Console.Title = AppName;

        try
        {
            var appDirectory = FindAppDirectory(AppContext.BaseDirectory);
            var launcherScript = ResolveLauncherScript(appDirectory);

            if (launcherScript == null)
            {
                ShowError(
                    "No se encontro iniciar-capiclub.bat.",
                    "Ejecuta instalar.bat o revisa que la carpeta del sistema este completa.",
                    appDirectory);
                return 1;
            }

            var process = new Process
            {
                StartInfo = new ProcessStartInfo
                {
                    FileName = "cmd.exe",
                    Arguments = "/c call \"" + launcherScript + "\"",
                    WorkingDirectory = appDirectory,
                    UseShellExecute = false,
                },
            };

            process.Start();
            process.WaitForExit();
            return process.ExitCode;
        }
        catch (Exception exception)
        {
            ShowError("No se pudo iniciar CapiClub Inventario.", exception.Message, AppContext.BaseDirectory);
            return 1;
        }
    }

    private static string FindAppDirectory(string startDirectory)
    {
        var current = new DirectoryInfo(startDirectory);

        for (var depth = 0; current != null && depth < 6; depth++)
        {
            if (File.Exists(Path.Combine(current.FullName, "package.json")))
            {
                return current.FullName;
            }

            current = current.Parent;
        }

        return startDirectory;
    }

    private static string ResolveLauncherScript(string appDirectory)
    {
        var candidates = new[]
        {
            Path.Combine(appDirectory, "scripts", "windows", "iniciar-capiclub.bat"),
            Path.Combine(appDirectory, "iniciar-capiclub.bat"),
        };

        foreach (var candidate in candidates)
        {
            if (File.Exists(candidate))
            {
                return candidate;
            }
        }

        return null;
    }

    private static void ShowError(string title, string detail, string appDirectory)
    {
        Console.ForegroundColor = ConsoleColor.Red;
        Console.WriteLine(title);
        Console.ResetColor();
        Console.WriteLine();
        Console.WriteLine(detail);
        Console.WriteLine();
        Console.WriteLine("Carpeta detectada:");
        Console.WriteLine(appDirectory);
        Console.WriteLine();
        Console.WriteLine("Presiona una tecla para cerrar.");
        Console.ReadKey(true);
    }
}
